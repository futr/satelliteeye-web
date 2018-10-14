// 初めて書いたJSなので多分むちゃくちゃです
// 以下のサイトのコードを利用させていただきました
// https://mementoo.info/
// http://jsfiddle.net/z3JtC/4
// https://stackoverflow.com/questions/13938686/can-i-load-a-local-file-into-an-html-canvas-element
// https://codepen.io/tuanitpro/pen/wJZJbp
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
 
    reader.readAsDataURL(file[0]);

    reader.onload = function(){
        originImg.onload = function() {
            // Calc size
            var iw = IMG_WIDTH;
            var ih = originImg.height / originImg.width * IMG_WIDTH;
            
            // Show img
            var canvas = document.createElement("canvas");
            canvas.width = iw;
            canvas.height = ih;
            var ctx = canvas.getContext('2d');
            
            ctx.drawImage( originImg, 0, 0, iw, ih );
            var dataURL = canvas.toDataURL();
            document.getElementById( parent.outputName ).innerHTML = "<img src='" + dataURL + "'>";
            
            parent.img.src = dataURL;
        }
        originImg.src = reader.result;
    }
}

window.addEventListener("DOMContentLoaded", function(){
    // Load a true image
    var selectTrue = document.getElementById("selectTrue");
    var trueImgHandler = new ImageHandler( trueImg, "outputTrue" );
    selectTrue.addEventListener( "change", trueImgHandler, false );
    
    var selectIR = document.getElementById("selectIR");
    var IRImgHandler = new ImageHandler( IRImg, "outputIR" );
    selectIR.addEventListener( "change", IRImgHandler, false );
});

function processImage() {
    // Check images have been loaded
    if ( !trueImg.src || !IRImg.src ) {
        return;
    }
    
    // Disable buttons
    setButtonEnable( "selectTrue", false );
    setButtonEnable( "selectIR", false );
    setButtonEnable( "processButton", false );
    
    // Show progress
    
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext('2d');
    
    var w = trueImg.width;
    var h = trueImg.height;
    
    // Check size
    if ( w != IRImg.width || h != IRImg.height ) {
        return;
    }
    
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
    
    // Show Image result
    var dataURL = null;
    ctx.putImageData( falseImgData, 0, 0 );
    dataURL = canvas.toDataURL('image/jpeg',0.7);
    document.getElementById("outputFalse").innerHTML = "<img src='" + dataURL + "'>";
    
    ctx.putImageData( naturalImgData, 0, 0 );
    dataURL = canvas.toDataURL('image/jpeg',0.7);
    document.getElementById("outputNatural").innerHTML = "<img src='" + dataURL + "'>";
    
    ctx.putImageData( NDVIImgData, 0, 0 );
    dataURL = canvas.toDataURL('image/jpeg',0.7);
    document.getElementById("outputNDVI").innerHTML = "<img src='" + dataURL + "'>";
    
    // Enable buttons
    setButtonEnable( "selectTrue", true );
    setButtonEnable( "selectIR", true );
    setButtonEnable( "processButton", true );
}

function setButtonEnable( buttonName, status ) {
    document.getElementById( buttonName ).disabled = !status;
}
