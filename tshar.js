/* Casting price calculator by Argonaut twitter.com/astrointhenight */
/* Version 1.0 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/controls/OrbitControls.js';
import { MeshStandardMaterial, AxesHelper } from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );

const controls = new OrbitControls( camera, renderer.domElement );

camera.position.set( 0, 10, 5 );
controls.update();


const targetDiv = document.getElementById('card');
const rendererWidth = 650;
const rendererHeight = 400;
renderer.setSize(rendererWidth, rendererHeight);
targetDiv.appendChild(renderer.domElement);

const loader = new STLLoader();


/* Axis */


const axes = new AxesHelper(10); 

axes.material.transparent = true; 
axes.material.opacity = 1; 
axes.material.linewidth = 3; 
axes.material.color.set(0xFFFFFF);

axes.position.set(-2, 0, -2);
axes.rotation.x = -Math.PI /2;
axes.rotation.z = -Math.PI /2;  

scene.add(axes);




/* Grid */

class Grid extends THREE.Group {
    constructor(size, cellColor, sectionColor) {
        super();

        const grid1 = new THREE.GridHelper(
            size,
            10,
            new THREE.Color(cellColor),
            new THREE.Color(cellColor)
        );

        grid1.material.color.set(new THREE.Color(cellColor));
        grid1.material.vertexColors = false;

        const grid2 = new THREE.GridHelper(
            size,
            10,
            new THREE.Color(sectionColor),
            new THREE.Color(sectionColor)
        );

        grid2.material.color.set(new THREE.Color(sectionColor));
     
        grid2.material.vertexColors = false;

        grid1.renderOrder = grid2.renderOrder = 1;
        this.add(grid1, grid2);
        
    }
}

const grid = new Grid(20, 0xaaaaaa, 0x888888);
scene.add(grid);

/* Model */

let mesh; 
let modelVolume = 0;


loader.load('model.stl', function (geometry) {
    geometry.computeBoundingBox();
    const standardMaterial = new THREE.MeshStandardMaterial({
        color: 0xC0C0C0, 
        roughness: 0.5,
        metalness: 0.5, 
        flatShading: true,
    });
    mesh = new THREE.Mesh(geometry, standardMaterial);
    scene.add(mesh);

    mesh.rotation.x = -Math.PI / 2;

    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const modelCenter = boundingBox.getCenter(new THREE.Vector3());
    mesh.position.y = -modelCenter.y * -0.2;

    mesh.position.x = modelCenter.x;
    mesh.position.z = modelCenter.z +4;
    
    const scaleFactor = 0.1;
    mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

    modelVolume = getVolume(geometry);

    const size = boundingBox.getSize(new THREE.Vector3());
    updateInfoDisplay(mesh, size);
});


/* Input file function*/

const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', function(event) {
    const selectedFile = event.target.files[0];
    replaceModelWithCustom(selectedFile);
});

function getVolume(geometry) {
    let position = geometry.attributes.position;
    let faces = position.count / 3;
    let sum = 0;
    let p1 = new THREE.Vector3(),
        p2 = new THREE.Vector3(),
        p3 = new THREE.Vector3();
    for (let i = 0; i < faces; i++) {
        p1.fromBufferAttribute(position, i * 3 + 0);
        p2.fromBufferAttribute(position, i * 3 + 1);
        p3.fromBufferAttribute(position, i * 3 + 2);
        sum += signedVolumeOfTriangle(p1, p2, p3);

    }
    const volumeCm = sum / 1000;

    return volumeCm;
}

function signedVolumeOfTriangle(p1, p2, p3) {
    return p1.dot(p2.cross(p3)) / 6.0;
}


function replaceModelWithCustom(file) {
    if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    loader.load(URL.createObjectURL(file), function (geometry) {
        geometry.computeBoundingBox();
        const customMaterial = new MeshStandardMaterial({
            color: 0xFFFFFF, 
            roughness: 0.5,
            metalness: 0.5,
            flatShading: true,
        });
        mesh = new THREE.Mesh(geometry, customMaterial);
        scene.add(mesh);
        
        mesh.rotation.x = -Math.PI / 2;

        const boundingBox = new THREE.Box3().setFromObject(mesh);
        const modelCenter = boundingBox.getCenter(new THREE.Vector3());
        mesh.position.y = -modelCenter.y * -0.2;

        mesh.position.x = modelCenter.x * -0.1;
        mesh.position.z = mesh.position.z;
        
        const scaleFactor = 0.1;
        mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

        modelVolume = getVolume(geometry);

        const size = boundingBox.getSize(new THREE.Vector3());
        updateInfoDisplay(mesh, size);

    });
}


  

/* Camera */

const aspectRatio = rendererWidth / rendererHeight;
camera.aspect = aspectRatio;
camera.updateProjectionMatrix();

renderer.shadowMap.enabled = true;
renderer.setClearColor(0xDDDDDD);

controls.enableZoom = true;
controls.enablePan = false;
controls.enableRotate = true;


/* Radians to angles*/

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}


/* Light */

const light = new THREE.AmbientLight(0xffffff, 0.7); // soft white light
scene.add( light );

function createDirectionalLight(name, position, color, intensity) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.copy(position);
    scene.add(light);
    return light;
}

light.position.y = 120;
light.position.x = 200;
light.position.z = 200;


const cameraPosition = new THREE.Vector3(0, 20, 10); 
const directionalLightFront = createDirectionalLight('directionalLightFront', cameraPosition, 0xffffff, 0.3);
const directionalLightBack = createDirectionalLight('directionalLightBack', cameraPosition.clone().multiplyScalar(-1), 0xffffff, 0.6);

scene.add(directionalLightFront);
scene.add(directionalLightBack);



/* Light debug */

// const lightGeometry = new THREE.SphereGeometry(20, 32, 32); 
// const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
// const lightIndicator = new THREE.Mesh(lightGeometry, lightMaterial);
// lightIndicator.position.copy(light.position);
// scene.add(lightIndicator);



/* Materials */

let density = 13.6;
let jobprice = 6.5;
let rate = 34.92;

const materialButtons = document.querySelectorAll('.btn-material');
const caratSelect = document.getElementById('caratSelect');
const colorSelect = document.getElementById('colormat');

caratSelect.addEventListener('change', () => {
    const selectedCarat = caratSelect.value;
    const material = document.querySelector('.btn-material.active').getAttribute('data-material');

    switch (material) {
        case 'gold':
            switch (selectedCarat) {
                    case '14KT': 
                density = 13.6;
                rate = 34.92;
                break;
                    case '10KT':
                density = 11.54;
                rate = 24.77;
                break;
                    case '18KT':
                density = 15.96;
                rate = 44.58;
                break;
            }
            jobprice = 6.5;
            break;
        case 'silver':
            density = 10.36;
            rate = 5;
            jobprice = 0;
            break;
        case 'brass':
            density = 8.16;
            rate = 3.5;
            break;
        case 'platinum':
            density = 21.45;
            rate = 904;
            jobprice = 17;
            break;        
        default:
            density = 13.6;
            rate = 34.92;
            jobprice = 6.5;
    }
    // console.log(`material ${material}, carat = ${selectedCarat}, density = ${density}`);
});


materialButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        materialButtons.forEach(btn => btn.classList.remove('active'));
    
        button.classList.add('active');
        const material = button.getAttribute('data-material');
        const selectedCarat = caratSelect.value; 
        switch (material) {
            case 'gold':
                colorSelect.classList.remove('hidden');
                caratSelect.classList.remove('hidden');

                switch (selectedCarat){
                case '14KT': 
                    density = 13.6;
                    rate = 34.92;
                    break;
                case '10KT':
                    density = 11.54;
                    rate = 24.77;
                    break;
                case '18KT':
                    density = 15.96;
                    rate = 44.58;
                    break;
                }
                jobprice = 6.5;
                break;
            case 'silver':
                colorSelect.classList.add('hidden');
                caratSelect.classList.add('hidden');
                density = 10.36;
                rate = 5;
                jobprice = 0;
                break;
            case 'brass':
                colorSelect.classList.add('hidden');
                caratSelect.classList.add('hidden');
                density = 8.16;
                rate = 3.5;
                break;
            case 'platinum':
                colorSelect.classList.add('hidden');
                caratSelect.classList.add('hidden');    
                density = 21.45;
                rate = 904;
                jobprice = 17;
                break;        
            default:
                density = 13.6;
                rate = 34.92;
                jobprice = 6.5;
        }
        // console.log(`material ${material}, carat = ${selectedCarat}, density = ${density}`);
    });
});



/* Coordinates and Model Volume Display */

const infoDisplay = document.createElement('div');
infoDisplay.style.position = 'absolute';
infoDisplay.style.top = '10px';
infoDisplay.style.left = '10px';
infoDisplay.style.color = 'white';
infoDisplay.style.fontFamily = 'Arial, sans-serif';
infoDisplay.style.fontSize = '14px';
document.body.appendChild(infoDisplay);



/* Debug */






/* Run */

function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);

    controls.update();
    
    if (mesh) {
        const boundingBox = new THREE.Box3().setFromObject(mesh);
        const size = boundingBox.getSize(new THREE.Vector3());
        updateInfoDisplay(mesh, size);
    } else {
        updateInfoDisplay(null, null);
    }
}
function updateInfoDisplay(model, size) {
    const cameraRotation = camera.rotation;
    const infoContainer = document.getElementById('infoDisplay');
    if (model && size) {
        const sizeInMM = {
            x: (size.x * 10).toFixed(2),
            y: (size.y * 10).toFixed(2),
            z: (size.z * 10).toFixed(2),
        };
        infoContainer.innerHTML = `<b>Camera Rotation:</b> X: ${radiansToDegrees(cameraRotation.x).toFixed(2)}°, Y: ${radiansToDegrees(cameraRotation.y).toFixed(2)}°, Z: ${radiansToDegrees(cameraRotation.z).toFixed(2)}°<br/><b>Size:</b> ${sizeInMM.z} x ${sizeInMM.x} x ${sizeInMM.y} mm<br><b>Model Volume:</b> ${modelVolume.toFixed(2)} cm³`;    
    } else {
        infoContainer.innerHTML = `<b>Camera Rotation:</b> X: ${radiansToDegrees(cameraRotation.x).toFixed(2)}°, Y: ${radiansToDegrees(cameraRotation.y).toFixed(2)}°, Z: ${radiansToDegrees(cameraRotation.z).toFixed(2)}°<br/><b>Size:</b> N/A<br><b>Model Volume:</b> ${modelVolume.toFixed(2)} cm³`;
    }
    updateWeightAndPrice();
}


function updateWeightAndPrice() {

    const volumeCm = Math.round(modelVolume * 100) / 100;

    const weight = volumeCm * density;

    const job = weight * jobprice;

    const price = rate * weight + job;

    const modelprice= document.querySelector('.modelprice');

    modelprice.innerHTML = `<h1>Total Price</h1> </br> </br> <b>Weight</b>: ${weight.toFixed(2)} g <br> <b>Price:</b> ${price.toFixed(2)} $`;
  }
  



animate();

function onResize() {
    camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
}

window.addEventListener("resize", onResize);
