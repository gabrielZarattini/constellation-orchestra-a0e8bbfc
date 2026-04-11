import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HandData, GestureType } from '@/hooks/useHandTracking';

const PARTICLE_COUNT = 200;

const GESTURE_COLORS: Record<GestureType, string> = {
  none: '#38bdf8',
  open_palm: '#38bdf8',
  fist: '#ef4444',
  pinch: '#a855f7',
  point: '#22d3ee',
  peace: '#10b981',
};

function Particles({ handData }: { handData: HandData }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const velocities = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const targets = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const colorRef = useRef(new THREE.Color('#38bdf8'));
  const prevGesture = useRef<GestureType>('none');

  // Initialize random positions
  useMemo(() => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      velocities.current[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities.current[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const targetColor = new THREE.Color(GESTURE_COLORS[handData.gesture]);
    colorRef.current.lerp(targetColor, 0.05);

    // Convert normalized hand coords to 3D space
    const handX = handData.isActive ? (handData.indexTip.x - 0.5) * -8 : 0;
    const handY = handData.isActive ? (handData.indexTip.y - 0.5) * -6 : 0;

    // Gesture changed - burst effect
    if (handData.gesture !== prevGesture.current && handData.gesture !== 'none') {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        velocities.current[i * 3] += (Math.random() - 0.5) * 0.1;
        velocities.current[i * 3 + 1] += (Math.random() - 0.5) * 0.1;
        velocities.current[i * 3 + 2] += (Math.random() - 0.5) * 0.1;
      }
    }
    prevGesture.current = handData.gesture;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      if (handData.isActive) {
        let tx: number, ty: number, tz: number;

        switch (handData.gesture) {
          case 'open_palm': {
            // Orbit around hand
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + time * 0.5;
            const radius = 1.5 + Math.sin(time * 2 + i * 0.1) * 0.5;
            tx = handX + Math.cos(angle) * radius;
            ty = handY + Math.sin(angle) * radius;
            tz = Math.sin(angle * 2 + time) * 1;
            break;
          }
          case 'fist': {
            // Collapse to hand
            tx = handX + (Math.random() - 0.5) * 0.3;
            ty = handY + (Math.random() - 0.5) * 0.3;
            tz = (Math.random() - 0.5) * 0.3;
            break;
          }
          case 'pinch': {
            // DNA helix
            const t = (i / PARTICLE_COUNT) * Math.PI * 4;
            const helixR = 0.8 + handData.pinchDistance * 10;
            const strand = i % 2 === 0 ? 1 : -1;
            tx = handX + Math.cos(t + time * 2) * helixR * strand;
            ty = handY + (i / PARTICLE_COUNT - 0.5) * 6;
            tz = Math.sin(t + time * 2) * helixR;
            break;
          }
          case 'point': {
            // Stream towards point direction
            const streamAngle = Math.atan2(handY, handX);
            const dist = (i / PARTICLE_COUNT) * 6;
            tx = handX + Math.cos(streamAngle) * dist + (Math.random() - 0.5) * 0.3;
            ty = handY + Math.sin(streamAngle) * dist + (Math.random() - 0.5) * 0.3;
            tz = Math.sin(time * 3 + i * 0.2) * 0.5;
            break;
          }
          case 'peace': {
            // Two spirals (V shape)
            const side = i < PARTICLE_COUNT / 2 ? -1 : 1;
            const idx = i % (PARTICLE_COUNT / 2);
            const spiralT = (idx / (PARTICLE_COUNT / 2)) * Math.PI * 3 + time;
            tx = handX + side * 1.5 + Math.cos(spiralT) * 0.5;
            ty = handY - (idx / (PARTICLE_COUNT / 2)) * 4;
            tz = Math.sin(spiralT) * 0.5;
            break;
          }
          default: {
            // Float around hand
            const floatAngle = (i / PARTICLE_COUNT) * Math.PI * 2 + time * 0.3;
            const floatR = 2 + Math.sin(i * 0.5 + time) * 1;
            tx = handX + Math.cos(floatAngle) * floatR;
            ty = handY + Math.sin(floatAngle * 0.7) * floatR;
            tz = Math.sin(floatAngle + time) * 1.5;
            break;
          }
        }

        targets.current[i3] = tx;
        targets.current[i3 + 1] = ty;
        targets.current[i3 + 2] = tz;
      } else {
        // No hand - gentle float
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + time * 0.1;
        targets.current[i3] = Math.cos(angle + i) * 3;
        targets.current[i3 + 1] = Math.sin(angle * 0.7 + i) * 2;
        targets.current[i3 + 2] = Math.sin(angle * 0.5) * 2;
      }

      // Spring physics
      const spring = handData.gesture === 'fist' ? 0.15 : 0.04;
      const damping = 0.92;

      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      velocities.current[i3] += (targets.current[i3] - dummy.position.x) * spring;
      velocities.current[i3 + 1] += (targets.current[i3 + 1] - dummy.position.y) * spring;
      velocities.current[i3 + 2] += (targets.current[i3 + 2] - dummy.position.z) * spring;

      velocities.current[i3] *= damping;
      velocities.current[i3 + 1] *= damping;
      velocities.current[i3 + 2] *= damping;

      dummy.position.x += velocities.current[i3];
      dummy.position.y += velocities.current[i3 + 1];
      dummy.position.z += velocities.current[i3 + 2];

      // Scale based on gesture
      const baseScale = handData.isActive ? 0.04 + Math.sin(time * 3 + i) * 0.015 : 0.025;
      dummy.scale.setScalar(baseScale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Update color for all instances
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.color.copy(colorRef.current);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.8} toneMapped={false} />
    </instancedMesh>
  );
}

function HandCursor({ handData }: { handData: HandData }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || !handData.isActive) return;

    const x = (handData.indexTip.x - 0.5) * -8;
    const y = (handData.indexTip.y - 0.5) * -6;

    meshRef.current.position.x += (x - meshRef.current.position.x) * 0.2;
    meshRef.current.position.y += (y - meshRef.current.position.y) * 0.2;
    meshRef.current.position.z = 2;

    const scale = handData.gesture === 'pinch' ? 0.15 : 0.1;
    meshRef.current.scale.setScalar(scale);

    if (ringRef.current) {
      ringRef.current.position.copy(meshRef.current.position);
      ringRef.current.rotation.z = state.clock.elapsedTime;
      const ringScale = handData.gesture === 'open_palm' ? 0.5 : 0.3;
      ringRef.current.scale.setScalar(ringScale);
    }
  });

  if (!handData.isActive) return null;

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} toneMapped={false} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[1, 0.05, 8, 32]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </>
  );
}

export function GestureParticleOverlay({ handData }: { handData: HandData }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Particles handData={handData} />
        <HandCursor handData={handData} />
      </Canvas>
    </div>
  );
}
