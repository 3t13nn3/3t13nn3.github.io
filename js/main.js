window.addEventListener("load", event => new Home());

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

const PI = Math.PI

class Home {

    constructor() {

        console.log("Home loaded")

        this.initialize();

    }

    async initialize() {

        let address = window.location.href;

        this.mvc = new MVC("home", this, new HomeModel(), new HomeView(), new HomeController());

        await this.mvc.initialize(); // run init async tasks
        this.mvc.view.attach(document.body); // attach view
        this.mvc.view.activate(); // activate user interface

    }

}

/*MODEL*/
class HomeModel extends Model {

    constructor() {
        super();
    }

    async initialize(mvc) {
        super.initialize(mvc);
    }

}


/*VIEW*/
class HomeView extends View {

    constructor() {
        super();
    }

    async destruct() {
        this.mvc.view.detach(); // detach view
        this.mvc.view.deactivate(); // deactivate user interface

        cancelAnimationFrame(this.animationFrameLoop);
    }

    async initialize(mvc) {
        super.initialize(mvc);

        var newStyle = document.createElement('style');
        newStyle.appendChild(document.createTextNode("\
        @font-face {\
            font-family: Mario;\
            src: url('./font/Mario.ttf') \
        }\
        "));

        document.head.appendChild(newStyle);

        this.title = document.createElement("div")
        this.title.innerHTML = "Etienne PENAULT"
        this.title.style.textAlign = "center"
        this.title.style.position = "absolute"
        this.title.style.width = "100%"
        this.title.style.top = "2.5%"
        this.title.style.fontSize = "5vmax"
        this.title.style.fontFamily = "Mario"
        
        this.title.style.backgroundColor = "rgba(76, 175, 80, 0.0)"
        document.body.appendChild(this.title);

        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);

        console.log("Canvas: " + window.innerWidth + " " + window.innerHeight);

        const gl = this.canvas.getContext("webgl");

        this.onResize()

        this.r = (Math.random() * (0.75 - 0.1) + 0.1);
        this.g = (Math.random() * (0.75 - 0.1) + 0.1);
        this.b = (Math.random() * (0.75 - 0.1) + 0.1);

        this.rState = false;
        this.gState = true;
        this.bState = true;

        this.vs = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoord;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying highp vec2 UV;

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            UV = aTextureCoord;
        }
        `;

        this.fs = `
        varying highp vec2 UV;

        uniform lowp vec3 color;
        uniform lowp float time;

        const int iteration = 200;
        const int scale 	= 400;

        lowp float realJulia 		= -0.7269/*-0.8*/;
        lowp float imaginaryJulia	=  0.1889/*0.156*/;

        void main(){

            lowp vec2 zTmp, z, cTmp;
            lowp float border;
            lowp vec4 finalColor;
            int iTmp;

            //We get the FragCoord and we divide it bit the viewport size to normalize the coord then we center them by removing 0.5
            lowp vec2 c = UV - 0.5;

            //Go Back to screenCoord by the window proportion
            c.x *= float(1);

            c *= float(5);

            //Add The Zoom 
            //c /= (1000)/10.0;



            c *= float(1);

            //Add the X and Y Offset
            c += vec2(-0.5, 0);


            z 			= c;
            cTmp		= c;

            /*Replace our complex component by our Julia values*/
                z.x 	   +=0.5;
                cTmp.x 	   +=0.5;
                cTmp 		= vec2(realJulia,imaginaryJulia);


            /*Multiply every part of our complex by a number between [-1:1] in function of the time*/

                cTmp.x	   *= cos(time*0.02);
                cTmp.x	   += sin(time*0.05);
                cTmp.y	   *= sin(time*0.06);
                cTmp.y	   += tan(time*0.08);



            for(int i =0; i< iteration; i++){

                /*Infinity limit*/
                if((z.x*z.x) + (z.y*z.y) > float(20)){
                    break;
                }

                /*Mandelbrot formula*/
                highp float x = z.x*z.x - z.y*z.y;
                highp float y = float(2) * z.x * z.y;

                zTmp.x = x + cTmp.x;
                zTmp.y = y + cTmp.y;		

                z = zTmp;
                iTmp = i;	
            }


            /*Color change by the time and the actual complexs*/
            if(color.x < color.z && color.y < color.z){
                finalColor = vec4(
                                    (iTmp == iteration ? 0.0 : float(float(iTmp)*cos(time*float(0.5))/float(10))),
                                    (iTmp == iteration ? 0.0 : float(iTmp)) / float(50.0),
                                    cos(sqrt(float(iTmp)/float(iteration))*time)/float(1.5),
                                    1
                                );
            } else if(color.x < color.y && color.z < color.y){
                
                finalColor = vec4(
                    (iTmp == iteration ? 0.0 : float(iTmp)) / float(50.0),
                    cos(sqrt(float(iTmp)/float(iteration))*time)/float(1.5),
                    (iTmp == iteration ? 0.0 : float(float(iTmp)*cos(time*float(0.5))/float(10))),
                    1
                );
            } else {
                
                finalColor = vec4(
                    cos(sqrt(float(iTmp)/float(iteration))*time)/float(1.5),
                    (iTmp == iteration ? 0.0 : float(float(iTmp)*cos(time*float(0.5))/float(10))),
                    (iTmp == iteration ? 0.0 : float(iTmp)) / float(50.0),
                    1
                );

            }

            gl_FragColor = finalColor;
        }
        `;

        if (gl === null) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }

        this.then = 0;

        this.squareRotation = 0.0;

        const shaderProgram = this.initShaderProgram(gl, this.vs, this.fs);

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                //vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
                textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                squareColor: gl.getUniformLocation(shaderProgram, 'color'),
                time: gl.getUniformLocation(shaderProgram, 'time'),
            },
        };


        const buffers = this.initBuffers(gl);

        const texture = this.loadTexture(gl, 'https://avatars3.githubusercontent.com/u/45465151?s=460&u=4bee928c2f8b061013d86008e00b991069056f6e&v=4');

        var then = 0;

        // Draw the scene repeatedly
        let render = (now) => {
            this.onResize()
            this.title.style.color = "rgb("+ this.b * 255 / 8 + "," + this.r * 255 / 8 + "," + this.g * 255 / 8 + ")"
            now *= 0.001;  // convert to seconds
            const deltaTime = now - then;
            then = now;

            this.drawScene(gl, programInfo, buffers, texture, deltaTime);

            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);


    }


    onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Initialize a shader program, so WebGL knows how to draw our data
    initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }

    // creates a shader of the given type, uploads the source and
    // compiles it.
    loadShader(gl, type, source) {
        const shader = gl.createShader(type);

        // Send the source to the shader object

        gl.shaderSource(shader, source);

        // Compile the shader program

        gl.compileShader(shader);

        // See if it compiled successfully

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }


    initBuffers(gl) {
        // Create a buffer for the cube's vertex positions.

        const positionBuffer = gl.createBuffer();

        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Now create an array of positions for the cube.

        const positions = [
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0,
        ];

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Now set up the texture coordinates for the faces.

        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

        const textureCoordinates = [
            // Front
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            // Back
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            // Top
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            // Bottom
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            // Right
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            // Left
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ];


        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
            gl.STATIC_DRAW);

        // Build the element array buffer; this specifies the indices
        // into the vertex arrays for each face's vertices.

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        const indices = [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23,   // left
        ];

        // Now send the element array to GL

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices), gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            textureCoord: textureCoordBuffer,
            indices: indexBuffer,
        };

    }

    //
    // Initialize a texture and load an image.
    // When the image finished loading copy it into the texture.
    //
    loadTexture(gl, url) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Because images have to be download over the internet
        // they might take a moment until they are ready.
        // Until then put a single pixel in the texture so we can
        // use it immediately. When the image has finished downloading
        // we'll update the texture with the contents of the image.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border, srcFormat, srcType,
            pixel);

        const image = new Image();

        image.crossOrigin = 'anonymous';
        
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                srcFormat, srcType, image);

            // WebGL1 has different requirements for power of 2 images
            // vs non power of 2 images so check if the image is a
            // power of 2 in both dimensions.
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                // Yes, it's a power of 2. Generate mips.
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                // No, it's not a power of 2. Turn of mips and set
                // wrapping to clamp to edge
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        };
        image.src = url;

        return texture;
    }
    //image.crossOrigin = 'anonymous';

    drawScene(gl, programInfo, buffers, texture, deltaTime) {

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(this.r, this.g, this.b, 1.0);  // Clear to black, fully opaque

        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

        // Clear the canvas before we start drawing on it.

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Create a perspective matrix, a special matrix that is
        // used to simulate the distortion of perspective in a camera.
        // Our field of view is 45 degrees, with a width/height
        // ratio that matches the display size of the canvas
        // and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        const fieldOfView = 45 * Math.PI / 180;   // in radians
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();

        // note: glmatrix.js always has the first argument
        // as the destination to receive the result.
        mat4.perspective(projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar);

        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        const modelViewMatrix = mat4.create();

        // Now move the drawing position a bit to where we want to
        // start drawing the square.

        mat4.translate(modelViewMatrix,     // destination matrix
            modelViewMatrix,     // matrix to translate
            //[Math.sin(this.squareRotation * 0.356) * 3, Math.cos(this.squareRotation), -8.0]);  // amount to translate
            [0.0, 0.0, -8.0]);  // amount to translate
        
            
        /*mat4.rotate(modelViewMatrix,  
            modelViewMatrix,  
            this.squareRotation / 1.5,     
            [0, 0, 1]);       
        mat4.rotate(modelViewMatrix,  
            modelViewMatrix,  
            this.squareRotation / 1.5 * .512,
            [0, 1, 0]);       
        mat4.rotate(modelViewMatrix,  
            modelViewMatrix,  
            this.squareRotation / 1.5 * .247,
            [1, 0, 0]); */
        

        /*diamond rot*/
        
        mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                PI/2,
                [0, 1, 1]);

        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.squareRotation/2,
            [1, 1, 1]);





        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL how to pull out the texture coordinates from
        // the texture coordinate buffer into the textureCoord attribute.
        {
            const numComponents = 2;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
            gl.vertexAttribPointer(
                programInfo.attribLocations.textureCoord,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.textureCoord);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        // Tell WebGL to use our program when drawing

        gl.useProgram(programInfo.program);

        // Set the shader uniforms

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        // Specify the texture to map onto the faces.

        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }

        this.squareRotation += deltaTime;
        gl.uniform3f(programInfo.uniformLocations.squareColor, this.b*1.5, this.r*1.5, this.g*1.5);
        gl.uniform1f(programInfo.uniformLocations.time,this.squareRotation*2);


        /*Changement du fond*/
        if (this.r > 0.75)
            this.rState = true
        if (this.g > 0.75)
            this.gState = true
        if (this.b > 0.75)
            this.bState = true

        if (this.r < 0)
            this.rState = false
        if (this.g < 0)
            this.gState = false
        if (this.b < 0)
            this.bState = false

        if (!this.gState)
            this.g += 0.0007;
        else if (!this.rState)
            this.r += 0.0005;
        else if (!this.bState)
            this.b += 0.001;

        if (this.rState)
            this.r -= 0.001;
        else if (this.gState)
            this.g -= 0.0005;
        else if (this.bState)
            this.b -= 0.0007;

    }


}


class HomeController extends Controller {

    constructor() {
        super();
    }

    initialize(mvc) {
        super.initialize(mvc);

    }

    addListeners() {
        this.windowResizeHandler = event => this.onResize(event);
        window.addEventListener("resize", this.windowResizeHandler);
    }

    removeListeners() {
        window.removeEventListener("resize", this.windowResizeHandler);
    }

    activate() {
        super.activate();
        this.addListeners();
    }

    deactivate() {
        super.deactivate();
        this.removeListeners();
    }

}