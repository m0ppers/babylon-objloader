/*global BABYLON */
import OBJLoader from './babylon.objloader';

BABYLON.OBJLoader = OBJLoader;
BABYLON.SceneLoader.RegisterPlugin(new OBJLoader());