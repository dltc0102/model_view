import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Global variables
let scene, camera, renderer, controls, currentModel, gui;

// Available models and their paths
const modelFiles = {
  'Regular Hand': '/hand_model.glb',
  'Skeleton Hand': '/skeleton_hand.glb'
};

// Model-specific view presets
const modelPresets = {
  'Regular Hand': {
    'Default': {
      position: { x: -10, y: -20, z: -7 },
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: -1.02, y: -1.06, z: 0.07 }
    },
    'Palm View': {
      position: { x: 1, y: 39, z: -6 },
      scale: { x: 1.2, y: 1.2, z: 1.2 },
      rotation: { x: 4.41, y: 1.72, z: 0.07 }
    },
    'Side View': {
      position: { x: -31, y: 23, z: 12 },
      scale: { x: 1.2, y: 1.2, z: 1.2 },
      rotation: { x: 4.95, y: -5.81, z: -6.34 }
    }
  },
  'Skeleton Hand': {
    'Default': {
      position: { x: 10, y: 30, z: 8 },
      scale: { x: 1.1, y: 1.1, z: 1.1 },
      rotation: { x: -0.7, y: -6.2, z: -3.2 }
    },
    'Palm View': {
      position: { x: -11, y: -9, z: 11 },
      scale: { x: 1.1, y: 1.1, z: 1.1 },
      rotation: { x: 3.8, y: 3.1, z: 3.1 }
    },
    'Wrist View': {
      position: { x: 12, y: 4, z: 4 },
      scale: { x: 1.1, y: 1.1, z: 1.1 },
      rotation: { x: 3.1, y: 1.8, z: -1.6 }
    }
  }
};

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#3E3E3E");

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1, 5);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // OrbitControls setup
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // Configure mouse buttons
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.DOLLY
  };

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Stage and helpers
  const stageGeometry = new THREE.BoxGeometry(100, 0.1, 100);
  const stageMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
  const stage = new THREE.Mesh(stageGeometry, stageMaterial);
  stage.position.y = -0.55;
  scene.add(stage);

  scene.add(new THREE.GridHelper(100, 100));
  scene.add(new THREE.AxesHelper(100));

  // Load initial model
  loadModel(modelFiles['Regular Hand']);

  // Window resize handler
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();

  // add pointer events
}


function loadModel(modelPath) {
  const loader = new GLTFLoader();

  if (currentModel) scene.remove(currentModel);

  loader.load(
    modelPath,
    (gltf) => {
      currentModel = gltf.scene;
      scene.add(currentModel);

      const modelName = Object.keys(modelFiles).find(
        key => modelFiles[key] === modelPath
      );

      applyPreset(modelName, 'Default');
      createGUI(modelName); // Initialize GUI AFTER model loads
    },
    undefined,
    (error) => console.error('Error loading model:', error)
  );
}

function applyPreset(modelName, presetName) {
  if (!currentModel || !modelPresets[modelName] || !modelPresets[modelName][presetName]) return;

  const preset = modelPresets[modelName][presetName];

  currentModel.position.set(
    preset.position.x,
    preset.position.y,
    preset.position.z
  );
  currentModel.rotation.set(
    preset.rotation.x,
    preset.rotation.y,
    preset.rotation.z
  );
  currentModel.scale.set(
    preset.scale.x,
    preset.scale.y,
    preset.scale.z
  );
}

function createGUI(currentModelName) {
  if (gui) gui.destroy();

  gui = new GUI({ title: 'Model Controls', width: 300 });

  // Model selector dropdown
  gui.add({
    model: currentModelName
  }, 'model', Object.keys(modelFiles))
    .name('Model')
    .onChange(modelName => {
      loadModel(modelFiles[modelName]);
    });

  // View presets dropdown (model-specific)
  const presetOptions = Object.keys(modelPresets[currentModelName]);
  gui.add({
    view: 'Default'
  }, 'view', presetOptions)
    .name('View Preset')
    .onChange(presetName => {
      applyPreset(currentModelName, presetName);
    });

  // Position controls
  const positionFolder = gui.addFolder('Position');
  positionFolder.add(currentModel.position, 'x', -1000, 1000, 1).name('X');
  positionFolder.add(currentModel.position, 'y', -1000, 1000, 1).name('Y');
  positionFolder.add(currentModel.position, 'z', -1000, 1000, 1).name('Z');

  // Rotation controls
  const rotationFolder = gui.addFolder('Rotation');
  rotationFolder.add(currentModel.rotation, 'x', -10, 10, 0.1).name('X');
  rotationFolder.add(currentModel.rotation, 'y', -10, 10, 0.1).name('Y');
  rotationFolder.add(currentModel.rotation, 'z', -10, 10, 0.1).name('Z');

  // Scale control
  gui.add(currentModel.scale, 'x', 0.1, 5, 0.1).name('Scale')
    .onChange(v => currentModel.scale.set(v, v, v));

  gui.open();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

init();