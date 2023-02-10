import { Canvas } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { Suspense } from "react";

const Scene = ({ src }) => {
  const fbx = useLoader(FBXLoader, src);

  return <primitive object={fbx} scale={0.01}  style={{ height: 500 }}/>;
};

export default function FBXViewer({ src, height }) {
  return (
    <Canvas style={{ height }} shadowMap={true}>
      <Suspense fallback={null} style={{ height }}>
        <Scene src={src} />
        <OrbitControls />
        <Environment preset="sunset" background />
      </Suspense>
    </Canvas>
  );
}
