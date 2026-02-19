'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Stars() {
  const starsRef = useRef<THREE.Points>(null)

  // Check if we're on a mobile device to reduce star count
  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' &&
      (window.matchMedia('(max-width: 768px)').matches ||
      navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/));
  }, []);

  const stars = useMemo(() => {
    const count = isMobile ? 300 : 1000 // Reduce stars on mobile
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Create stars in a sphere around the camera
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const radius = 15 + Math.random() * 10

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // White to cyan to purple colors
      const rand = Math.random()
      if (rand > 0.7) {
        colors[i * 3] = 1
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 1
      } else if (rand > 0.4) {
        colors[i * 3] = 0
        colors[i * 3 + 1] = 0.8
        colors[i * 3 + 2] = 1
      } else {
        colors[i * 3] = 0.6
        colors[i * 3 + 1] = 0.3
        colors[i * 3 + 2] = 1
      }

      sizes[i] = isMobile ? Math.random() * 0.02 + 0.01 : Math.random() * 0.05 + 0.02 // Smaller stars on mobile
    }

    return { positions, colors, sizes }
  }, [isMobile])

  useFrame((state) => {
    if (starsRef.current) {
      const rotationSpeed = isMobile ? 0.005 : 0.01 // Slower rotation on mobile
      starsRef.current.rotation.y = state.clock.elapsedTime * rotationSpeed
      starsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * (isMobile ? 0.02 : 0.05) // Slower oscillation on mobile
    }
  })

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[stars.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[stars.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[stars.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isMobile ? 0.02 : 0.05} // Smaller points on mobile
        vertexColors
        transparent
        opacity={isMobile ? 0.6 : 0.8} // Slightly less opacity on mobile
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function ShootingStars() {
  const groupRef = useRef<THREE.Group>(null)

  // Check if we're on a mobile device to reduce shooting stars
  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' &&
      (window.matchMedia('(max-width: 768px)').matches ||
      navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const movementSpeed = isMobile ? 0.05 : 0.1 // Slower movement on mobile
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh
        mesh.position.x += movementSpeed
        mesh.position.y -= isMobile ? 0.025 : 0.05 // Slower movement on mobile

        if (mesh.position.x > 15) {
          mesh.position.x = -15
          mesh.position.y = 10
          mesh.position.z = -10 + Math.random() * 5
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {[...Array(isMobile ? 2 : 5)].map((_, i) => ( // Fewer shooting stars on mobile
        <mesh
          key={i}
          position={[-15 + i * (isMobile ? 10 : 6), 10, -10 + i * (isMobile ? 3 : 2)]} // Spread out more on mobile
        >
          <sphereGeometry args={[isMobile ? 0.02 : 0.05, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={isMobile ? 0.7 : 0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Moon() {
  const moonRef = useRef<THREE.Mesh>(null)

  // Check if we're on a mobile device to reduce rotation speed
  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' &&
      (window.matchMedia('(max-width: 768px)').matches ||
      navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/));
  }, []);

  useFrame((state) => {
    if (moonRef.current) {
      const rotationSpeed = isMobile ? 0.05 : 0.1 // Slower rotation on mobile
      moonRef.current.rotation.y = state.clock.elapsedTime * rotationSpeed
    }
  })

  return (
    <mesh ref={moonRef} position={[8, 5, -15]}>
      <sphereGeometry args={[isMobile ? 1 : 1.5, 32, 32]} /> {/* Smaller moon on mobile */}
      <meshStandardMaterial
        color="#e0e7ff"
        emissive="#a5b4fc"
        emissiveIntensity={isMobile ? 0.3 : 0.5} // Less intense on mobile
        roughness={0.8}
      />
    </mesh>
  )
}

function Nebula() {
  const nebulaRef = useRef<THREE.Points>(null)

  // Check if we're on a mobile device to reduce nebula particles
  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' &&
      (window.matchMedia('(max-width: 768px)').matches ||
      navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/));
  }, []);

  const nebula = useMemo(() => {
    const count = isMobile ? 100 : 300 // Reduce particles on mobile
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 8

      positions[i * 3] = Math.cos(angle) * radius - 5
      positions[i * 3 + 1] = Math.sin(angle) * radius + 2
      positions[i * 3 + 2] = -20 + Math.random() * 5

      colors[i * 3] = 0.4 + Math.random() * 0.3
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.4
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1
    }

    return { positions, colors }
  }, [isMobile])

  useFrame((state) => {
    if (nebulaRef.current) {
      const rotationSpeed = isMobile ? 0.01 : 0.02 // Slower rotation on mobile
      nebulaRef.current.rotation.z = state.clock.elapsedTime * rotationSpeed
    }
  })

  return (
    <points ref={nebulaRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[nebula.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[nebula.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isMobile ? 0.1 : 0.2} // Smaller particles on mobile
        vertexColors
        transparent
        opacity={isMobile ? 0.2 : 0.3} // Lower opacity on mobile
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function ProfileBackground3D() {
  // Check if we're on a mobile device to reduce complexity
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches ||
      navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 opacity-50">
      <Canvas
        camera={{
          position: [0, 0, isMobile ? 10 : 8], // Adjust camera position for mobile
          fov: isMobile ? 90 : 75 // Wider fov on mobile
        }}
        className="w-full h-full"
        frameloop={isMobile ? 'never' : 'always'} // Disable animation loop on mobile when not needed
      >
        <color attach="background" args={['#000814']} />
        <ambientLight intensity={isMobile ? 0.05 : 0.1} /> {/* Less intense on mobile */}
        <pointLight
          position={[10, 10, 10]}
          intensity={isMobile ? 0.2 : 0.3}
          color="#4f46e5"
        />

        <Stars />
        { !isMobile && <ShootingStars /> } {/* Don't render shooting stars on mobile */}
        <Moon />
        <Nebula />
      </Canvas>
    </div>
  )
}
