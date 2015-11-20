import BABYLON from 'babylonjs';
import OBJLoader from './babylon.objloader';

BABYLON.OBJLoader = OBJLoader;
BABYLON.SceneLoader.RegisterPlugin(new OBJLoader());
