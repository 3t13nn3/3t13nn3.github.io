window.addEventListener("load", event => new Home());

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

	async destruct(){
		this.mvc.view.detach(); // detach view
        this.mvc.view.deactivate(); // deactivate user interface
        
        cancelAnimationFrame(this.animationFrameLoop);
	}

	async initialize(mvc) {
        super.initialize(mvc);

        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);

        console.log("Canvas: " + window.innerWidth + " " +  window.innerHeight);
        
		this.gl       = this.canvas.getContext("webgl");

		this.onResize()

        this.r = 0;
        this.g = 0;
        this.b = 0;

        this.rState = false;
        this.gState = false;
        this.bState = false;
        
        this.vs = `
        
        `;
        
        this.fs = `
        
        `;
        
        if (this.gl === null) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }
        
        
        this.glLoop()
    }
    
    glLoop(){
        this.animationFrameLoop = window.requestAnimationFrame( () => this.glLoop());
        this.draw()
    }

    onResize(){
        this.canvas.width   = window.innerWidth;
        this.canvas.height  = window.innerHeight;
    }

    draw(){

        this.onResize()

        this.gl.clearColor(this.r, this.g, this.b, 1.0);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        if(this.r > 0.15)
            this.rState = true
        if(this.g > 0.15)
            this.gState = true
        if(this.b > 0.25)
            this.bState = true

        if(this.r < 0)
            this.rState = false
        if(this.g < 0)
            this.gState = false
        if(this.b < 0)
            this.bState = false

        if(!this.rState)
            this.r += 0.0001;
        if(!this.gState)
            this.g += 0.0005;
        if(!this.bState)
            this.b += 0.0007;

        if(this.rState)
            this.r -= 0.0007;
        if(this.gState)
            this.g -= 0.0001;
        if(this.bState)
            this.b -= 0.0005;


        //this.canvas.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }


    // Initialize a shader program, so WebGL knows how to draw our data
    initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
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