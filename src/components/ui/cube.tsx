"use client";
import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Mesh, Group } from "three";
import { Edges } from "@react-three/drei";
import { EffectComposer, DepthOfField, Noise } from "@react-three/postprocessing";

// Component khối đơn với hiệu ứng delay
type DelayedCubeProps = {
  position: [number, number, number];
  delay: number; // Giá trị từ 0 (trung tâm) đến 1 (khối xa nhất)
};

const DelayedCube: React.FC<DelayedCubeProps> = ({ position, delay }) => {
  const cubeRef = useRef<Mesh>(null);

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    const period = 16; // Tổng chu kỳ (giây)
    const T_expand = 6; // Thời gian phóng to (từ 0 đến 1)
    const T_hold = 4;   // Thời gian giữ ở max scale (1)
    const T_shrink = 6; // Thời gian thu nhỏ (từ 1 về 0)

    // Áp dụng delay: nếu elapsed nhỏ hơn delay * period, cube vẫn ở trạng thái 0
    let adjustedTime = elapsed - delay * period;
    if (adjustedTime < 0) adjustedTime = 0;
    adjustedTime = adjustedTime % period;

    let scaleFactor = 0;
    if (adjustedTime < T_expand) {
      // Phóng to: từ 0 -> 1
      scaleFactor = adjustedTime / T_expand;
    } else if (adjustedTime < T_expand + T_hold) {
      // Giữ nguyên: scale = 1
      scaleFactor = 1;
    } else {
      // Thu nhỏ: từ 1 -> 0
      scaleFactor = 1 - (adjustedTime - (T_expand + T_hold)) / T_shrink;
    }

    if (cubeRef.current) {
      // Sử dụng lerp để chuyển mượt giữa các giá trị scale
      cubeRef.current.scale.lerp({ x: scaleFactor, y: scaleFactor, z: scaleFactor }, delta * 10);
    }
  });

  return (
    <mesh ref={cubeRef} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="transparent" transparent opacity={0} />
      <Edges threshold={15} color="#0054f0" scale={1} />
    </mesh>
  );
};

// Component nhóm các khối
type AnimatedCubesGroupProps = {
  rotationSpeed: number;
};

const AnimatedCubesGroup: React.FC<AnimatedCubesGroupProps> = ({ rotationSpeed }) => {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Xoay mượt dựa trên delta để duy trì 60FPS
      const smoothSpeed = rotationSpeed * delta * 60;
      groupRef.current.rotation.x += smoothSpeed;
      groupRef.current.rotation.y += smoothSpeed;
    }
  });

  return (
    <group ref={groupRef} scale={[2, 2, 2]}>
      {[-1, 0, 1].map((x) =>
        [-1, 0, 1].map((y) =>
          [-1, 0, 1].map((z) => {
            const pos: [number, number, number] = [x * 1.5, y * 1.5, z * 1.5];
            const delay = (Math.abs(x) + Math.abs(y) + Math.abs(z)) / 3;
            return <DelayedCube key={`${x}-${y}-${z}`} position={pos} delay={delay} />;
          })
        )
      )}
    </group>
  );
};

type CubeSceneProps = {
  className?: string;
  rotationSpeed?: number;
};

const CubeScene: React.FC<CubeSceneProps> = ({
  className,
  rotationSpeed = 0.002,
}) => {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]} // Điều chỉnh density phù hợp với màn hình
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#0ff" />
        <directionalLight position={[-5, -5, 5]} intensity={0.5} color="#0ff" />

        <AnimatedCubesGroup rotationSpeed={rotationSpeed} />

        <EffectComposer multisampling={8} enableNormalPass>
          <DepthOfField
            focusDistance={0.02}
            focalLength={0.05}
            bokehScale={2}
            height={480}
          />
          <Noise opacity={0.05} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default CubeScene;
