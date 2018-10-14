// 初めて書いたJSなので多分むちゃくちゃです
// 以下のサイトのコードを利用させていただきました
// https://mementoo.info/
// http://jsfiddle.net/z3JtC/4
// https://stackoverflow.com/questions/13938686/can-i-load-a-local-file-into-an-html-canvas-element
// https://codepen.io/tuanitpro/pen/wJZJbp
// https://weworkweplay.com/play/saving-html5-canvas-as-image/
// https://codepen.io/noahblon/post/a-practical-guide-to-flexbox-understanding-space-between-the-unsung-hero
// あとモジラのチュートリアルを見つつ、むりくり書きました
// https://developer.mozilla.org/ja/docs/Web/Guide/HTML/Canvas_tutorial/Basic_usage
//
// 画像が大きい場合遅すぎるのでなんとかしたい
// 多分URL変換が重い?
//
// オブジェクト？は参照渡しが基本と考えるが、
// 例えば
// parent.img = new Image();
// をすると、引数として渡したグローバルなポインタを書きかえて欲しいが、実際は参照が書き換わるだけ。newは参照の書き換え？
//

const R = 0;
const G = 1;
const B = 2;
const A = 3;
const PMAX = 255;
const IMG_WIDTH = 1024;

var trueImg = new Image();
var IRImg = new Image();
var falseImg = new Image();
var NDVIImg = new Image();

var NDVICanvas = null;

var normalizeColor = function( src, dest, w, h ) {
    var mins = [PMAX,PMAX,PMAX];
    var maxs = [0,0,0];
    
    // Search mins and maxs
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;
            var r = src[idx + R];
            var g = src[idx + G];
            var b = src[idx + B];
            
            if ( r > maxs[R] ) maxs[R] = r; 
            if ( g > maxs[G] ) maxs[G] = g; 
            if ( b > maxs[B] ) maxs[B] = b;
            
            if ( r < mins[R] ) mins[R] = r; 
            if ( g < mins[G] ) mins[G] = g;  
            if ( b < mins[B] ) mins[B] = b;  
        }
    }
    
    // Normalize
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;

            dest[idx + R] = ( src[idx + R] - mins[R] ) / ( maxs[R] - mins[R] ) * PMAX;
            dest[idx + G] = ( src[idx + G] - mins[G] ) / ( maxs[G] - mins[G] ) * PMAX;
            dest[idx + B] = ( src[idx + B] - mins[B] ) / ( maxs[B] - mins[B] ) * PMAX;
            
            dest[idx + A] = PMAX;
        }
    }
}

var createFalseImage = function( trueSrc, IRSrc, dest, w, h ) {    
    // Create false image
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;
            
            dest[idx + R] = IRSrc[idx + R];
            dest[idx + G] = trueSrc[idx + R];
            dest[idx + B] = trueSrc[idx + G];
            dest[idx + A] = PMAX;
        }
    }
}

var createNaturalImage = function( trueSrc, IRSrc, dest, w, h ) {    
    // Create Natural image
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;
            
            dest[idx + R] = trueSrc[idx + R];
            dest[idx + G] = IRSrc[idx + R];
            dest[idx + B] = trueSrc[idx + G];
            dest[idx + A] = PMAX;
        }
    }
}

var createNDVIImage = function( trueSrc, IRSrc, dest, w, h ) {    
    // Create NDVI image
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;
            
            var val = ( IRSrc[idx + R] - trueSrc[idx + R] ) / ( IRSrc[idx + R] + trueSrc[idx + R] ) * PMAX;
            
            dest[idx + R] = val;
            dest[idx + G] = val;
            dest[idx + B] = val;
            dest[idx + A] = PMAX;
        }
    }
}

// Image Handler class
function ImageHandler( img, name )
{
    this.outputName = name;
    this.img = img;
}

ImageHandler.prototype.handleEvent = function( event ) {
    var parent = this;
    var originImg = new Image();
    var file = event.target.files;
    var reader = new FileReader();
 
    if ( file[0] ) {
        reader.readAsDataURL(file[0]);
    }

    reader.onload = function(){
        originImg.onload = function() {
            // Disable UIs
            setAllButtonEnable( false ); 
            showProcessSpinner( true );
            
            // Calc size
            var iw = IMG_WIDTH;
            var ih = originImg.height / originImg.width * IMG_WIDTH;
            
            // Show img
            var canvas = document.createElement( "canvas" );
            canvas.width = iw;
            canvas.height = ih;
            var ctx = canvas.getContext( "2d" );
            
            ctx.drawImage( originImg, 0, 0, iw, ih );
            var dataURL = canvas.toDataURL( 'image/jpeg', 0.7 );
            document.getElementById( parent.outputName ).src = dataURL;
            document.getElementById( parent.outputName + "A" ).href = dataURL;
            
            parent.img.src = dataURL;
            
            // Enable UIs
            setAllButtonEnable( true ); 
            showProcessSpinner( false );
        }
        originImg.src = reader.result;
    }
}

var mouseMoveOnNDVIImg = function( evt ) {
    // Mouse move event handler of NDVI Image
	if ( !NDVICanvas ) return;
	
	var ix = evt.offsetX / evt.target.offsetWidth * NDVICanvas.width;
    var iy = evt.offsetY / evt.target.offsetHeight * NDVICanvas.height;
	
    if ( ix < 0 || iy < 0 || ix >= NDVICanvas.width || iy >= NDVICanvas.height ) {
        return;
    }
    
	var px = NDVICanvas.getContext('2d').getImageData( ix, iy, 1, 1 ); 
    
    document.getElementById( "NDVIPixelValue" ).innerHTML = "NDVI値 : " + ( px.data[0] / PMAX ).toFixed( 3 );
}

window.addEventListener("DOMContentLoaded", function(){
    // Load a true image
    var selectTrue = document.getElementById( "selectTrue" );
    var trueImgHandler = new ImageHandler( trueImg, "outputTrue" );
    selectTrue.addEventListener( "change", trueImgHandler, false );
    
    // Load a NIR Image
    var selectIR = document.getElementById( "selectIR" );
    var IRImgHandler = new ImageHandler( IRImg, "outputIR" );
    selectIR.addEventListener( "change", IRImgHandler, false );
    
    // Mouse event
    var NDVIImgElement = document.getElementById( "outputNDVI" );
    NDVIImgElement.addEventListener( "mousemove", mouseMoveOnNDVIImg );
});

function processImage() {
    // Check images have been loaded
    if ( !trueImg.src || !IRImg.src ) {
        alert( "可視光画像と近赤外画像を選択してください" );
        return;
    }
    
    // Check IE
    var ua = window.navigator.userAgent.toLowerCase();

    if( ua.indexOf('msie') >= 0 || ua.indexOf('trident') >= 0 ) {
        alert( "申し訳ありません\nInternetExplorerでは実行できません" );
        return;
    }
    
    var w = trueImg.width;
    var h = trueImg.height;
    
    // Check size
    if ( w != IRImg.width || h != IRImg.height ) {
		alert( "同じ大きさの画像を選択してください" );
        
        // Enable buttons
        setAllButtonEnable( true ); 
        // Hide spinner
        showProcessSpinner( false );
        
        return;
    }
    
    // Disable buttons
    setAllButtonEnable( false ); 
    // Show progress
    showProcessSpinner( true );
    
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext('2d');
    
    canvas.width = w;
    canvas.height = h;
    
    // Create ImageData
    ctx.drawImage( trueImg, 0, 0 );
    var trueImgData = ctx.getImageData( 0, 0, w, h );
    var normTrueImgData = ctx.createImageData( w, h );
    
    ctx.drawImage( IRImg, 0, 0 );
    var IRImgData = ctx.getImageData( 0, 0, w, h );
    var normIRImgData = ctx.createImageData( w, h );
    
    var falseImgData = ctx.createImageData( w, h );
    var naturalImgData = ctx.createImageData( w, h );
    var NDVIImgData = ctx.createImageData( w, h );
    
    // Normalize
    normalizeColor( trueImgData.data, normTrueImgData.data, w, h );
    normalizeColor( IRImgData.data, normIRImgData.data, w, h );
    
    // Process
    createFalseImage( normTrueImgData.data, normIRImgData.data, falseImgData.data, w, h );
    createNaturalImage( normTrueImgData.data, normIRImgData.data, naturalImgData.data, w, h );
    createNDVIImage( trueImgData.data, IRImgData.data, NDVIImgData.data, w, h );
    
    // Create result canvas
    NDVICanvas = document.createElement( "canvas" );
    NDVICanvas.width = w;
    NDVICanvas.height = h;
    NDVICanvas.getContext('2d').putImageData( NDVIImgData, 0, 0 ); 
    
    
    // Show Image result
    showResultImage( canvas, ctx, falseImgData, "outputFalse" );
    showResultImage( canvas, ctx, naturalImgData, "outputNatural" );
    showResultImage( canvas, ctx, NDVIImgData, "outputNDVI" );
    
    // Enable buttons
    setAllButtonEnable( true ); 
    // Hide spinner
    showProcessSpinner( false );
}

function showResultImage( canvas, ctx, imgData, id ) {
    ctx.putImageData( imgData, 0, 0 );
    var dataURL = canvas.toDataURL( 'image/jpeg', 0.7 );
    document.getElementById( id ).src = dataURL;
    document.getElementById( id + "A" ).href = dataURL;
} 

function setAllButtonEnable( status ) {
    setButtonEnable( "selectTrueButton", status );
    setButtonEnable( "selectIRButton", status );
    setButtonEnable( "processButton", status );
}

function setButtonEnable( buttonName, status ) {
    document.getElementById( buttonName ).disabled = !status;
}

function showProcessSpinner( status ) {
    /*
    if ( status ) {
        document.getElementById( "processSpinner" ).classList.add( "is-active" );
    } else {
        document.getElementById( "processSpinner" ).classList.remove( "is-active" );
    }
    */
}
