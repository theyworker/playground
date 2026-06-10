import * as THREE from "three";

// Each building plays its own predefined MP3 (named after the building,
// in public/audio/) as looping positional audio — walk closer and it gets
// louder. The speaker button broadcasts "pac-speaker" events that gate
// the master volume.
const TRACKS: { file: string; x: number; y: number; z: number }[] = [
  { file: "/audio/mansion.mp3", x: 0, y: 1.5, z: 0 },
  { file: "/audio/dehans-korean-bbq.mp3", x: -7, y: 1.5, z: 26 },
  { file: "/audio/tycoon-house.mp3", x: 17.5, y: 1.5, z: 26 },
  { file: "/audio/devinds-place.mp3", x: -7, y: 1.5, z: 40 },
  { file: "/audio/cmyna-crib.mp3", x: 16, y: 1.5, z: 41 },
  { file: "/audio/form-pilates-studio.mp3", x: 3, y: 1.5, z: 55 },
  { file: "/audio/wadx-celpip-academy.mp3", x: -20, y: 1.5, z: 56.5 },
];

export function createMusic(
  camera: THREE.Camera,
  scene: THREE.Scene,
): { dispose: () => void } {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const loader = new THREE.AudioLoader();
  const sounds: THREE.PositionalAudio[] = [];
  let started = false;
  let disposed = false;

  for (const track of TRACKS) {
    const sound = new THREE.PositionalAudio(listener);
    sound.position.set(track.x, track.y, track.z);
    sound.setRefDistance(5);
    sound.setRolloffFactor(1.4);
    sound.setVolume(0.55);
    sound.setLoop(true);
    scene.add(sound);
    sounds.push(sound);
    loader.load(track.file, (buffer) => {
      if (disposed) return;
      sound.setBuffer(buffer);
      if (started) sound.play();
    });
  }

  // Browsers keep the AudioContext suspended until a user gesture; the
  // first key press or click/tap starts everything.
  const start = () => {
    if (started || disposed) return;
    started = true;
    listener.context.resume();
    for (const sound of sounds) {
      if (sound.buffer && !sound.isPlaying) sound.play();
    }
  };
  window.addEventListener("pointerdown", start);
  window.addEventListener("keydown", start);

  const onSpeaker = (event: Event) => {
    const muted = (event as CustomEvent<{ muted: boolean }>).detail.muted;
    listener.setMasterVolume(muted ? 0 : 1);
  };
  window.addEventListener("pac-speaker", onSpeaker);

  return {
    dispose: () => {
      disposed = true;
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("pac-speaker", onSpeaker);
      for (const sound of sounds) {
        if (sound.isPlaying) sound.stop();
        sound.disconnect();
        scene.remove(sound);
      }
      camera.remove(listener);
    },
  };
}
