import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { AgentStatus } from '@/store/useCrewStore';

const STATUS_COLORS: Record<AgentStatus, string> = {
  active: '#22c55e',
  thinking: '#3b82f6',
  waiting: '#f59e0b',
  error: '#ef4444',
  idle: '#64748b',
};

interface AgentNodeProps {
  id: string;
  name: string;
  avatar: string;
  status: AgentStatus;
  position: [number, number, number];
  selected: boolean;
  connecting?: boolean;
  connectionMode?: boolean;
  onClick: () => void;
}

export function AgentNode({ id, name, avatar, status, position, selected, connecting, connectionMode, onClick }: AgentNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const baseY = position[1];
  const offset = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    // Floating animation
    meshRef.current.position.y = baseY + Math.sin(t * 0.5 + offset.current) * 0.3;
    meshRef.current.position.x = position[0] + Math.sin(t * 0.3 + offset.current) * 0.1;
    meshRef.current.position.z = position[2] + Math.cos(t * 0.4 + offset.current) * 0.1;

    // Error shake
    if (status === 'error') {
      meshRef.current.position.x += Math.sin(t * 20) * 0.05;
    }
  });

  const color = STATUS_COLORS[status];
  const scale = status === 'active' ? 1.1 : status === 'error' ? 1.0 : 0.9;

  return (
    <group>
      <Sphere
        ref={meshRef}
        args={[0.5 * scale, 32, 32]}
        position={position}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={connecting ? '#a855f7' : color}
          emissive={connecting ? '#a855f7' : color}
          emissiveIntensity={connecting ? 1.2 : selected ? 0.8 : connectionMode ? (hovered ? 0.8 : 0.4) : hovered ? 0.5 : 0.3}
          transparent
          opacity={connecting ? 0.95 : 0.85}
          roughness={0.3}
          metalness={0.7}
        />
      </Sphere>

      <Html
        position={position}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">{avatar}</span>
          <span
            className="font-heading text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{
              background: `${color}22`,
              color,
              border: `1px solid ${color}44`,
            }}
          >
            {name}
          </span>
          {(status === 'thinking') && (
            <div className="flex gap-1 mt-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: color,
                    animation: `thinking-dots 1.4s infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
