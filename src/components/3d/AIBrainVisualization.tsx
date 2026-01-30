'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Trail } from '@react-three/drei'
import * as THREE from 'three'

interface AIBrainProps {
  sentiment: number // -1 to 1
  activity: number // 0 to 1
}

function PulsingOrb({ sentiment, activity }: AIBrainProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15
      
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1 * activity
      meshRef.current.scale.setScalar(scale)
    }
  })

  const color = useMemo(() => {
    if (sentiment > 0.3) {
      return new THREE.Color(0x10b981) // Green - Positive
    } else if (sentiment < -0.3) {
      return new THREE.Color(0xef4444) // Red - Negative
    } else {
      return new THREE.Color(0x00d4ff) // Cyan - Neutral
    }
  }, [sentiment])

  return (
    <Trail
      width={2}
      length={6}
      color={color}
      attenuation={(width) => width}
    >
      <Sphere ref={meshRef} args={[1, 32, 32]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Trail>
  )
}

function ParticleField({ sentiment }: { sentiment: number }) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const count = 100
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const radius = 2 + Math.random() * 2
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      const color = sentiment > 0.3 
        ? [0.06, 0.72, 0.51] // Green
        : sentiment < -0.3
        ? [0.94, 0.27, 0.27] // Red  
        : [0, 0.83, 1] // Cyan
      
      colors[i * 3] = color[0]
      colors[i * 3 + 1] = color[1]
      colors[i * 3 + 2] = color[2]
    }
    
    return { positions, colors }
  }, [sentiment])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
      />
    </points>
  )
}

export default function AIBrainVisualization({ sentiment = 0, activity = 0.5 }: AIBrainProps) {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <PulsingOrb sentiment={sentiment} activity={activity} />
        <ParticleField sentiment={sentiment} />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />
      </Canvas>
    </div>
  )
}