import * as THREE from "three";

// Each building has its own predefined MP3 (named after the building, in
// public/audio/). A track plays only while the crewmate is inside that
// building's footprint, fading in/out at the threshold. The speaker
// button broadcasts "pac-speaker" events that gate the master volume.
type Track = {
  file: string;
  x: number;
  z: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const VOLUME = 0.6;

const TRACKS: Track[] = [
  // The mansion: original house plus both wings.
  { file: "/audio/mansion.mp3", x: 0, z: 0, minX: -30, maxX: 14, minZ: -26, maxZ: 10 },
  { file: "/audio/dehans-korean-bbq.mp3", x: -7, z: 26, minX: -13, maxX: -1, minZ: 21, maxZ: 31 },
  { file: "/audio/tycoon-house.mp3", x: 17.5, z: 26, minX: 13, maxX: 22, minZ: 21, maxZ: 31 },
  { file: "/audio/devinds-place.mp3", x: -7, z: 40, minX: -13, maxX: -1, minZ: 34, maxZ: 46 },
  { file: "/audio/cmyna-crib.mp3", x: 16, z: 41, minX: 8, maxX: 24, minZ: 34, maxZ: 48 },
  { file: "/audio/form-pilates-studio.mp3", x: 3, z: 55, minX: -4, maxX: 10, minZ: 50, maxZ: 60 },
  { file: "/audio/wadx-celpip-academy.mp3", x: -20, z: 56.5, minX: -32, maxX: -8, minZ: 50, maxZ: 63 },
];

export function createMusic(
  camera: THREE.Camera,
  scene: THREE.Scene,
): {
  update: (delta: number, player: THREE.Vector3) => void;
  dispose: () => void;
} {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const loader = new THREE.AudioLoader();
  const sounds: { sound: THREE.PositionalAudio; track: Track; volume: number }[] = [];
  let started = false;
  let disposed = false;

  for (const track of TRACKS) {
    const sound = new THREE.PositionalAudio(listener);
    sound.position.set(track.x, 1.5, track.z);
    sound.setRefDistance(8);
    sound.setRolloffFactor(0.6);
    sound.setVolume(0);
    sound.setLoop(true);
    scene.add(sound);
    sounds.push({ sound, track, volume: 0 });
    loader.load(track.file, (buffer) => {
      if (disposed) return;
      sound.setBuffer(buffer);
    });
  }

  // Browsers keep the AudioContext suspended until a user gesture; the
  // first key press or click/tap unlocks playback.
  const start = () => {
    if (started || disposed) return;
    started = true;
    listener.context.resume();
  };
  window.addEventListener("pointerdown", start);
  window.addEventListener("keydown", start);

  const onSpeaker = (event: Event) => {
    const muted = (event as CustomEvent<{ muted: boolean }>).detail.muted;
    listener.setMasterVolume(muted ? 0 : 1);
  };
  window.addEventListener("pac-speaker", onSpeaker);

  const update = (delta: number, player: THREE.Vector3) => {
    for (const entry of sounds) {
      const { track, sound } = entry;
      const inside =
        player.x > track.minX && player.x < track.maxX &&
        player.z > track.minZ && player.z < track.maxZ;
      const target = inside ? VOLUME : 0;
      entry.volume += (target - entry.volume) * Math.min(1, delta * 5);

      if (inside && started && sound.buffer && !sound.isPlaying) {
        sound.play();
      }
      if (sound.isPlaying) {
        sound.setVolume(entry.volume);
        // Fully faded out and outside — stop so seven tracks aren't
        // decoding at once.
        if (!inside && entry.volume < 0.01) {
          entry.volume = 0;
          sound.pause();
        }
      }
    }
  };

  return {
    update,
    dispose: () => {
      disposed = true;
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("pac-speaker", onSpeaker);
      for (const { sound } of sounds) {
        if (sound.isPlaying) sound.stop();
        sound.disconnect();
        scene.remove(sound);
      }
      camera.remove(listener);
    },
  };
}
