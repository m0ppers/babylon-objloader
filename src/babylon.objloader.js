import BABYLON from 'babylonjs';

class OBJLoader {
	constructor() {
		this.extensions = ".obj";
	}
	
	importMesh(meshNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
		console.info("Importing OBJ");
		// mop: not optimal code but should make it simpler for now
		let foundObjects = this.parse(data);
		
		if (meshNames) {
			if (typeof meshNames == 'string') {
				meshNames = [meshNames];
			}
			foundObjects = foundObjects.filter((object) => {
				return meshNames.indexOf(object.name);
			})
		}
		foundObjects.forEach((object) => {
			let mesh = new BABYLON.Mesh(object.name, scene);
			let vertexData = new BABYLON.VertexData();
			let positions = [];
			let normals = [];
			let uvs = [];
			let indices = [];
			
			// mop: convert a face with n vertices to triangles
			// is it really that simple? works for 4 sided faces from blender at least :P
			let triangulate = function(face) {
				let triangles = [];
				for (let i=1;i<face.length - 1;i++) {
					triangles.push([face[0], face[i], face[i+1]]);
				}
				return triangles;
			};
			
			let ref = {};
			object.faces.forEach((face) => {
				let triangles = triangulate(face);
				triangles.forEach((triangle) => {
					triangle.forEach((vertex) => {
						let cacheKey = vertex.vertex + "_" + vertex.normal + "_" + vertex.uv;
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
	
	parse(data) {
		let extractVertices = function(data) {
			let vertices = data.match(/^(-?\d+(\.\d+)?)\s*(-?\d+(\.\d+)?)\s*(-?\d+(\.\d+)?)/);
			return [
				parseFloat(vertices[1]),
				parseFloat(vertices[3]),
				parseFloat(vertices[5]),
			];
		}
		
		let createObject = function(name) {
			return {
				name,
				'vertices': [],
				'normals': [],
				'faces': [],
				'uvs': [],
			};
		};

		let parser = {
			'checkObject': function() {
				// mop: for cases where we don't have an object descriptor we create it if necessary
				if (!this.currentObject) {
					this.currentObject = createObject(undefined);
					this.parsedObjects.push(this.currentObject);
				}
			},
			'parsedObjects': [],
			'instruction_o': function(data) {
				// mop: reset everything
				this.currentObject = createObject(data);
				this.parsedObjects.push(this.currentObject);
			},
			'instruction_#': function() {},
			'instruction_vn': function(data) {
				this.checkObject();
				this.currentObject.normals.push(extractVertices(data));
			},
			'instruction_v': function(data) {
				this.checkObject();
				this.currentObject.vertices.push(extractVertices(data));
			},
			'instruction_f': function(data) {
				this.checkObject();
				let parts = data.match(/[^\s]+/g);
				let face = parts.map((vertexDef) => {
					let indices = vertexDef.split('/');
					
					let vertex = parseInt(indices[0], 10);
					let normal;
					let uv;
					if (indices.length > 1) {
						if (indices[1].length > 0) {
							uv = parseInt(indices[1], 10);
						}
					}
					if (indices.length > 2) {
						normal = parseInt(indices[2], 10);
					}
					return {
						vertex,
						uv,
						normal,
					}
				});
				this.currentObject.faces.push(face);
			},
			'instruction_vt': function(data) {
				this.checkObject();
				let uvs = data.match(/^(\d+(\.\d+)?)\s+(\d+(\.\d+)?)$/);
				this.currentObject.uvs.push([parseFloat(uvs[1]), parseFloat(uvs[3])]);
			},
			'instruction_s': function(data) {
				console.warn('Smoothing not supported yet');
			},
			'instruction_mtllib': function() {
				console.warn('materials not supported yet');
			},
			'instruction_usemtl': function() {
				console.warn('materials not supported yet');
			}
		}
		let lines = data.split('\n');
		lines.forEach((line) => {
			console.debug(line);
			line = line.trim();
			// todo: Lines can be logically joined with the line continuation character ( \ )
			if (line.length == 0) {
				return;
			}

			let instruction = line.split(' ')[0];
			let cb = 'instruction_' + instruction;
			// mop: extract the rest as instructionData trimming whitespaces so instructions
			// don't have to do that
			let instructionData = line.substr(instruction.length).trim();
			if (parser[cb]) {
				parser[cb](instructionData);
			} else {
				console.warn('Unhandled instruction', instruction);
			}
		});
		return parser.parsedObjects;
	}
}

export default OBJLoader;
