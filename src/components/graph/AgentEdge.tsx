import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Edge } from '@/store/useCrewStore';

const EDGE_COLORS: Record<Edge['status'], string> = {
  active: '#22c55e',
  waiting: '#f59e0b',
  error: '#ef4444',
  idle: '#60a5fa',
};

interface AgentEdgeProps {
  fromPos: [number, number, number];
  toPos: [number, number, number];
  status: Edge['status'];
}

export function AgentEdge({ fromPos, toPos, status }: AgentEdgeProps) {
  const lineRef = useRef<THREE.Line>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const color = EDGE_COLORS[status];

  const curve = useMemo(() => {
    const from = new THREE.Vector3(...fromPos);
    const to = new THREE.Vector3(...toPos);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y += 1;
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [fromPos, toPos]);

  const lineGeom = useMemo(() => {
    const points = curve.getPoints(40);
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [curve]);

  // Particle positions along curve
  const particleCount = 5;
  const particlePositions = useMemo(() => new Float32Array(particleCount * 3), []);
  const offsets = useMemo(() => Array.from({ length: particleCount }, (_, i) => i / particleCount), []);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    const t = clock.getElapsedTime();
    const speed = status === 'active' ? 0.4 : status === 'waiting' ? 0.15 : 0;

    for (let i = 0; i < particleCount; i++) {
      const progress = (offsets[i] + t * speed) % 1;
      const pt = curve.getPointAt(progress);
      particlePositions[i * 3] = pt.x;
      particlePositions[i * 3 + 1] = pt.y;
      particlePositions[i * 3 + 2] = pt.z;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const opacity = status === 'idle' ? 0.3 : status === 'error' ? 0.9 : 0.6;

  return (
    <group>
      {/* @ts-ignore - R3F line element differs from SVG line */}
      <line ref={lineRef} geometry={lineGeom}>
        <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={1} />
      </line>
      {(status === 'active' || status === 'waiting') && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={particlePositions}
              count={particleCount}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial color={color} size={0.12} transparent opacity={0.9} sizeAttenuation />
        </points>
      )}
    </group>
  );
}
