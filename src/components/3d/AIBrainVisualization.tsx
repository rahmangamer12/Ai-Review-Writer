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

  // Check if we're on a mobile device to reduce complexity
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches ||
      navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const rotationSpeed = isMobile ? 0.05 : 0.1; // Slower rotation on mobile
      meshRef.current.rotation.x = state.clock.elapsedTime * rotationSpeed
      meshRef.current.rotation.y = state.clock.elapsedTime * (rotationSpeed * 1.5)

      const scale = 1 + Math.sin(state.clock.elapsedTime * (isMobile ? 1 : 2)) * 0.1 * activity
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
      width={isMobile ? 1 : 2}
      length={isMobile ? 3 : 6}
      color={color}
      attenuation={(width) => width}
    >
      <Sphere ref={meshRef} args={[1, isMobile ? 16 : 32, isMobile ? 16 : 32]}> {/* Lower geometry on mobile */}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isMobile ? 0.3 : 0.5} // Less emissive on mobile
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Trail>
  )
}

function ParticleField({ sentiment }: { sentiment: number }) {
  const particlesRef = useRef<THREE.Points>(null)

  // Check if we're on a mobile device to reduce particle count
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches ||
      navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/);
  }, []);

  const particles = useMemo(() => {
    const count = isMobile ? 30 : 100 // Reduce particles on mobile
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
  }, [sentiment, isMobile])

  useFrame((state) => {
    if (particlesRef.current) {
      const rotationSpeed = isMobile ? 0.02 : 0.05 // Slower rotation on mobile
      particlesRef.current.rotation.y = state.clock.elapsedTime * rotationSpeed
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
        size={isMobile ? 0.03 : 0.05} // Smaller particles on mobile
        vertexColors
        transparent
        opacity={isMobile ? 0.4 : 0.6} // Lower opacity on mobile
      />
    </points>
  )
}

export default function AIBrainVisualization({ sentiment = 0, activity = 0.5 }: AIBrainProps) {
  // Check if we're on a mobile device to reduce complexity
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches ||
      navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/);
  }, []);

  return (
    <div className="w-full h-full min-h-[300px] sm:min-h-[400px]">
      <Canvas
        camera={{
          position: [0, 0, isMobile ? 6 : 5], // Further camera on mobile
          fov: isMobile ? 90 : 75 // Wider fov on mobile
        }}
        className="w-full h-full"
        frameloop={isMobile ? 'never' : 'always'} // Disable continuous rendering on mobile when not needed
        performance={{ min: isMobile ? 0.1 : 0.5 }} // Lower performance threshold on mobile
        gl={{
          alpha: true,
          antialias: !isMobile // Disable antialiasing on mobile for performance
        }}
      >
        <ambientLight intensity={isMobile ? 0.2 : 0.3} /> {/* Less intense on mobile */}
        <pointLight position={[10, 10, 10]} intensity={isMobile ? 0.7 : 1} />
        <pointLight position={[-10, -10, -10]} intensity={isMobile ? 0.3 : 0.5} />

        <PulsingOrb sentiment={sentiment} activity={activity} />
        <ParticleField sentiment={sentiment} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={!isMobile} // Disable auto-rotate on mobile to reduce performance impact
          autoRotateSpeed={isMobile ? 0.2 : 0.5} // Slower rotation on mobile when enabled
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />
      </Canvas>
    </div>
  )
}