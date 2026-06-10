import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const HOLOGRAM_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, normalize(vNormal))), 2.0);
    float scanline = 0.75 + 0.25 * sin(vWorldPosition.y * 60.0 - uTime * 6.0);
    float flicker = 0.85 + 0.15 * sin(uTime * 41.0) * sin(uTime * 17.3);
    float alpha = (0.3 + 0.7 * fresnel) * scanline * flicker * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const BEAM_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBottom;
  uniform float uTop;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    float t = clamp((vWorldPosition.y - uBottom) / (uTop - uBottom), 0.0, 1.0);
    float fade = pow(1.0 - t, 1.5);
    float shimmer = 0.8 + 0.2 * sin(vWorldPosition.y * 30.0 - uTime * 4.0);
    gl_FragColor = vec4(uColor, fade * shimmer * 0.16);
  }
`;

function baseOptions(): THREE.ShaderMaterialParameters {
  return {
    vertexShader: VERTEX_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  };
}

export function createHologramMaterial(
  color: number,
  opacity: number,
  wireframe = false,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    ...baseOptions(),
    fragmentShader: HOLOGRAM_FRAGMENT,
    wireframe,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
  });
}

export function createBeamMaterial(
  color: number,
  bottom: number,
  top: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    ...baseOptions(),
    fragmentShader: BEAM_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uBottom: { value: bottom },
      uTop: { value: top },
    },
  });
}
