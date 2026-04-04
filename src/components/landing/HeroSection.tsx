import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import * as THREE from 'three';

function HeroGraph() {
  const nodes = [
    { pos: [0, 0, 0] as [number, number, number], color: '#38bdf8', size: 0.3 },
    { pos: [2, 1.5, -1] as [number, number, number], color: '#a855f7', size: 0.25 },
    { pos: [-2, 1, -0.5] as [number, number, number], color: '#22d3ee', size: 0.25 },
    { pos: [1.5, -1.2, 0.5] as [number, number, number], color: '#f472b6', size: 0.2 },
    { pos: [-1.5, -1, 1] as [number, number, number], color: '#34d399', size: 0.2 },
    { pos: [0.5, 2, 0.5] as [number, number, number], color: '#fbbf24', size: 0.18 },
  ];

  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 4], [3, 5],
  ];

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#38bdf8" />
      <pointLight position={[-10, -5, -10]} intensity={0.6} color="#a855f7" />
      <Stars radius={30} depth={40} count={800} factor={2} saturation={0} fade speed={0.3} />

      {edges.map(([from, to], i) => {
        const points = [
          new THREE.Vector3(...nodes[from].pos),
          new THREE.Vector3(...nodes[to].pos),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial color="#38bdf8" opacity={0.3} transparent />
          </line>
        );
      })}

      {nodes.map((node, i) => (
        <Float key={i} speed={1.5 + i * 0.3} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={node.pos}>
            <sphereGeometry args={[node.size, 32, 32]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
          <HeroGraph />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80 z-[1]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Plataforma de Marketing com IA</span>
          </motion.div>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Orquestre seus </span>
            <span className="text-gradient-primary">Agentes de IA</span>
            <br />
            <span className="text-foreground">para Marketing</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Gere conteúdo multimodal, publique em todas as redes sociais e otimize campanhas automaticamente com IA — tudo em uma interface 3D imersiva.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6 glow-primary"
              onClick={() => navigate('/auth')}
            >
              Começar grátis por 14 dias
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver funcionalidades
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 flex items-center justify-center gap-8 text-muted-foreground text-sm"
          >
            <span>✓ Sem cartão de crédito</span>
            <span>✓ 8 redes sociais</span>
            <span className="hidden sm:inline">✓ IA generativa incluída</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
