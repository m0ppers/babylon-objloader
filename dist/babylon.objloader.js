/*global BABYLON */
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OBJLoader = (function () {
	function OBJLoader() {
		_classCallCheck(this, OBJLoader);

		this.extensions = ".obj";
	}

	_createClass(OBJLoader, [{
		key: "importMesh",
		value: function importMesh(meshNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
			console.info("Importing OBJ");
			// mop: not optimal code but should make it simpler for now
			var foundObjects = this.parse(data);

			if (meshNames) {
				if (typeof meshNames == 'string') {
					meshNames = [meshNames];
				}
				foundObjects = foundObjects.filter(function (object) {
					return meshNames.indexOf(object.name);
				});
			}
			foundObjects.forEach(function (object) {
				var mesh = new BABYLON.Mesh(object.name, scene);
				var vertexData = new BABYLON.VertexData();
				var positions = [];
				var normals = [];
				var uvs = [];
				var indices = [];

				// mop: convert a face with n vertices to triangles
				// is it really that simple? works for 4 sided faces from blender at least :P
				var triangulate = function triangulate(face) {
					var triangles = [];
					for (var i = 1; i < face.length - 1; i++) {
						triangles.push([face[0], face[i], face[i + 1]]);
					}
					return triangles;
				};

				var ref = {};
				object.faces.forEach(function (face) {
					var triangles = triangulate(face);
					triangles.forEach(function (triangle) {
						triangle.forEach(function (vertex) {
							var cacheKey = vertex.vertex + "_" + vertex.normal + "_" + vertex.uv;
							if (!ref[cacheKey]) {
								ref[cacheKey] = positions.length / 3;

								positions = positions.concat(object.vertices[vertex.vertex - 1]);
								normals = normals.concat(object.normals[vertex.normal - 1]);
								uvs = uvs.concat(object.uvs[vertex.uv - 1]);
							}
							indices.push(ref[cacheKey]);
						});
					});
				});
				// mop: not yet sure...stolen from the standard obj loader
				// faces are differently aligned so we are drawing on the wrong side :S
				indices.reverse();

				vertexData.set(uvs, BABYLON.VertexBuffer.UVKind);
				vertexData.set(positions, BABYLON.VertexBuffer.PositionKind);
				vertexData.set(normals, BABYLON.VertexBuffer.NormalKind);
				vertexData.indices = indices;

				vertexData.applyToMesh(mesh);
				meshes.push(mesh);
			});
			return true;
		}
	}, {
		key: "parse",
		value: function parse(data) {
			var extractVertices = function extractVertices(data) {
				var vertices = data.match(/^(-?\d+(\.\d+)?)\s*(-?\d+(\.\d+)?)\s*(-?\d+(\.\d+)?)/);
				return [parseFloat(vertices[1]), parseFloat(vertices[3]), parseFloat(vertices[5])];
			};

			var createObject = function createObject(name) {
				return {
					name: name,
					'vertices': [],
					'normals': [],
					'faces': [],
					'uvs': []
				};
			};

			var parser = {
				'checkObject': function checkObject() {
					// mop: for cases where we don't have an object descriptor we create it if necessary
					if (!this.currentObject) {
						this.currentObject = createObject(undefined);
						this.parsedObjects.push(this.currentObject);
					}
				},
				'parsedObjects': [],
				'instruction_o': function instruction_o(data) {
					// mop: reset everything
					this.currentObject = createObject(data);
					this.parsedObjects.push(this.currentObject);
				},
				'instruction_#': function instruction_() {},
				'instruction_vn': function instruction_vn(data) {
					this.checkObject();
					this.currentObject.normals.push(extractVertices(data));
				},
				'instruction_v': function instruction_v(data) {
					this.checkObject();
					this.currentObject.vertices.push(extractVertices(data));
				},
				'instruction_f': function instruction_f(data) {
					this.checkObject();
					var parts = data.match(/[^\s]+/g);
					var face = parts.map(function (vertexDef) {
						var indices = vertexDef.split('/');

						var vertex = parseInt(indices[0], 10);
						var normal = undefined;
						var uv = undefined;
						if (indices.length > 1) {
							if (indices[1].length > 0) {
								uv = parseInt(indices[1], 10);
							}
						}
						if (indices.length > 2) {
							normal = parseInt(indices[2], 10);
						}
						return {
							vertex: vertex,
							uv: uv,
							normal: normal
						};
					});
					this.currentObject.faces.push(face);
				},
				'instruction_vt': function instruction_vt(data) {
					this.checkObject();
					var uvs = data.match(/^(\d+(\.\d+)?)\s+(\d+(\.\d+)?)$/);
					this.currentObject.uvs.push([parseFloat(uvs[1]), parseFloat(uvs[3])]);
				},
				'instruction_s': function instruction_s(data) {
					console.warn('Smoothing not supported yet');
				},
				'instruction_mtllib': function instruction_mtllib() {
					console.warn('materials not supported yet');
				},
				'instruction_usemtl': function instruction_usemtl() {
					console.warn('materials not supported yet');
				}
			};
			var lines = data.split('\n');
			lines.forEach(function (line) {
				console.debug(line);
				line = line.trim();
				// todo: Lines can be logically joined with the line continuation character ( \ )
				if (line.length == 0) {
					return;
				}

				var instruction = line.split(' ')[0];
				var cb = 'instruction_' + instruction;
				// mop: extract the rest as instructionData trimming whitespaces so instructions
				// don't have to do that
				var instructionData = line.substr(instruction.length).trim();
				if (parser[cb]) {
					parser[cb](instructionData);
				} else {
					console.warn('Unhandled instruction', instruction);
				}
			});
			return parser.parsedObjects;
		}
	}]);

	return OBJLoader;
})();

BABYLON.OBJLoader = OBJLoader;
BABYLON.SceneLoader.RegisterPlugin(new OBJLoader());