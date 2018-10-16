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
// Worker実装に挑戦中
// とにかくJSではブロックしたりはできないらしい(UIスレッドとくっついてるから？)
// 昔の人はどうやって実装してたんだろうか
// WorkerにしたせいでChromeでローカルで動かなくなっちゃった
//

const IMG_WIDTH = 1024;
const PMAX = 255;
const SLIDER_WIDTH = 200;

var imgW = 0;
var imgH = 0;
var trueImg = new Image();
var IRImg = new Image();
var falseImg = new Image();
var NDVICanvas = document.createElement( "canvas" );
var NDVIImgData = null;
var imgWkr = null;
var trueImgHandler = null;
var IRImgHandler = null;

// 基底
var ImgWorkerMessage = {
    type: "NullMsg"
};

if ( window.Worker ) {
    // Create worker
    try {
        imgWkr = new Worker( "./worker.js" );
    } catch ( e ) {
        console.log( "Failed to start worker" );
    }
    
    imgWkr.addEventListener( "message", messageReceived, false );
} else {
    alert( "Workerをサポートしていないブラウザでは動作しません" );
}

// メッセージハンドラー
function messageReceived( e ) {
    var msgType = e.data.type;
    
    console.log( msgType );
    
    switch ( msgType ) {
    case "SetResultImgData":
        switch ( e.data.name ) {
        case "outputFalse":
            showResultImage( imgW, imgH, e.data.imgData, "outputFalse" );
            break;
        case "outputNatural":
            showResultImage( imgW, imgH, e.data.imgData, "outputNatural" );
            break;
        case "outputNDVI":
            NDVIImgData = e.data.imgData;
            showResultImage( imgW, imgH, e.data.imgData, "outputNDVI" );
            break;
        }
        break;
    case "CompleteProcess":
        processCompleted();
        break;
    }
}

// Image Handler class
function ImageHandler( img, name )
{
    this.outputName = name;
    this.img = img;
    this.imgData = null;
    this.iw = 0;
    this.ih = 0;
    this.shiftX = 0;
    this.shiftY = 0;
    this.canvas = document.createElement( "canvas" );
    this.ctx = this.canvas.getContext( "2d" );
    this.completeHandler = null;
}

ImageHandler.prototype.handleEvent = function( event ) {
    // 関数のprototypeが何かよくわからない
    // http://maeharin.hatenablog.com/entry/20130215/javascript_prototype_chain
    var obj = this;
    var originImg = new Image();
    var file = event.target.files;
    var reader = new FileReader();
 
    if ( !file[0] ) {
        return;
    }

    reader.onload = function() {
        originImg.onload = function() {
            // Disable UIs
            setAllButtonEnable( false ); 
            showProcessSpinner( true );
            
            // Clear
            obj.shiftX = 0;
            obj.shiftY = 0;
            
            // Calc size
            obj.iw = IMG_WIDTH;
            obj.ih = originImg.height / originImg.width * IMG_WIDTH;
            
            // Init canvas
            obj.canvas.width = obj.iw;
            obj.canvas.height = obj.ih;
            
            // Create input image
            obj.ctx.drawImage( originImg, 0, 0, obj.iw, obj.ih );
            obj.imgData = obj.ctx.getImageData( 0, 0, obj.iw, obj.ih );
            var dataURL = obj.canvas.toDataURL( 'image/jpeg', 0.7 );
            obj.img.src = dataURL;
            
            // Draw image
            document.getElementById( obj.outputName ).src = dataURL;
            document.getElementById( obj.outputName + "A" ).href = dataURL;
            
            // Post input image to worker
            obj.postCurrentImage.call( obj );
            
            // Call Complete handler
            if ( obj.completeHandler ) {
                obj.completeHandler();
            }
            
            // Enable UIs
            setAllButtonEnable( true ); 
            showProcessSpinner( false );
        }
        
        originImg.src = reader.result;
    }
    
    reader.readAsDataURL( file[0] );
}

ImageHandler.prototype.postCurrentImage = function() {
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "SetImg";
    msg.imgData = this.imgData;
    msg.name = this.outputName;
    imgWkr.postMessage( msg );
}

ImageHandler.prototype.drawImaegData = function( shiftX, shiftY ) {
    this.ctx.clearRect( 0, 0, this.iw, this.ih );            
    this.ctx.putImageData( this.imgData, shiftX, shiftY, 0, 0, this.iw, this.ih );
    var dataURL = this.canvas.toDataURL( 'image/jpeg', 0.7 );
    document.getElementById( this.outputName ).src = dataURL;
    document.getElementById( this.outputName + "A" ).href = dataURL;
}

function sliderTrueXChanged( val ) {
    trueImgHandler.shiftX = val - SLIDER_WIDTH / 2;
    trueImgHandler.drawImaegData( trueImgHandler.shiftX, trueImgHandler.shiftY );
    
    postShiftTrue();
}

function sliderTrueYChanged( val ) {
    trueImgHandler.shiftY = val - SLIDER_WIDTH / 2;
    trueImgHandler.drawImaegData( trueImgHandler.shiftX, trueImgHandler.shiftY );
    
    postShiftTrue();
}

function postShiftTrue()
{
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "SetTrueShiftX";
    msg.shiftX = trueImgHandler.shiftX;
    imgWkr.postMessage( msg );
    msg.type = "SetTrueShiftY";
    msg.shiftY = trueImgHandler.shiftY;
    imgWkr.postMessage( msg );
}

function trueImageLoaded()
{
    postShiftTrue();
    resetSlider();
    setSliderEnable( true );
}

function mouseMoveOnNDVIImg( evt ) {
    // Mouse move event handler of NDVI Image
	if ( !NDVICanvas ) return;
	
	var ix = evt.offsetX / evt.target.offsetWidth * NDVICanvas.width;
    var iy = evt.offsetY / evt.target.offsetHeight * NDVICanvas.height;
	
    if ( ix < 0 || iy < 0 || ix >= NDVICanvas.width || iy >= NDVICanvas.height ) {
        return;
    }
    
	var px = NDVICanvas.getContext('2d').getImageData( ix, iy, 1, 1 ); 
    
    document.getElementById( "NDVIPixelValue" ).innerHTML = "NDVI値 : " + ( px.data[0] / PMAX * 2 - 1 ).toFixed( 3 );
}

window.addEventListener( "DOMContentLoaded", function() {
    // Check IE
    var ua = window.navigator.userAgent.toLowerCase();

    if( ua.indexOf('msie') >= 0 || ua.indexOf('trident') >= 0 ) {
        alert( "申し訳ありません\nInternetExplorerでは実行できません" );
        // Disable buttons
        setAllButtonEnable( false ); 
        return;
    }
    
    // Load a true image
    var selectTrue = document.getElementById( "selectTrue" );
    trueImgHandler = new ImageHandler( trueImg, "outputTrue" );
    trueImgHandler.completeHandler = trueImageLoaded;
    selectTrue.addEventListener( "change", trueImgHandler, false );
    
    // Load a NIR Image
    var selectIR = document.getElementById( "selectIR" );
    IRImgHandler = new ImageHandler( IRImg, "outputIR" );
    selectIR.addEventListener( "change", IRImgHandler, false );
    
    // Mouse event
    var NDVIImgElement = document.getElementById( "outputNDVI" );
    NDVIImgElement.addEventListener( "mousemove", mouseMoveOnNDVIImg );
    
    // Reset UI
    setSliderEnable( false );
});

function processImage() {
    // Check images have been loaded
    if ( !trueImg.src || !IRImg.src ) {
        alert( "可視光画像と近赤外画像を選択してください" );
        return;
    }
    
    imgW = trueImg.width;
    imgH = trueImg.height;
    var w = imgW;
    var h = imgH;
    
    // Check size
    if ( w != IRImg.width || h != IRImg.height ) {
		alert( "同じ大きさの画像を選択してください" );
        return;
    }
    
    // Disable buttons
    setAllButtonEnable( false ); 
    // Disable slider
    setSliderEnable( false );
    // Show progress
    showProcessSpinner( true );
    
    // Clear result
    clearAllResultImage();
    
    // Post Image size
    postImageSize( w, h );
    
    // Post start process
    postStartProcess();
}

function postStartProcess() {
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "DoProcess";
    imgWkr.postMessage( msg );
}

function processCompleted() {
    // Create result canvas
    NDVICanvas.width = imgW;
    NDVICanvas.height = imgH;
    NDVICanvas.getContext('2d').putImageData( NDVIImgData, 0, 0 ); 
    
    // Enable buttons
    setAllButtonEnable( true ); 
    // Enable slider
    setSliderEnable( true );
    // Hide spinner
    showProcessSpinner( false ); 
}

function postImageSize( w, h ) {
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "SetSize";
    msg.w = w;
    msg.h = h;
    imgWkr.postMessage( msg );
}

function showResultImage( w, h, imgData, id ) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext('2d');
    
    canvas.width = w;
    canvas.height = h;
    
    ctx.putImageData( imgData, 0, 0 );
    var dataURL = canvas.toDataURL( 'image/jpeg', 0.7 );
    var img = document.getElementById( id );
    img.src = dataURL;
    document.getElementById( id + "A" ).href = dataURL;
} 

function setAllButtonEnable( status ) {
    setButtonEnable( "selectTrueButton", status );
    setButtonEnable( "selectIRButton", status );
    setButtonEnable( "processButton", status );
}

function clearAllResultImage()
{
    document.getElementById( "outputFalse" ).src = "";
    document.getElementById( "outputNatural" ).src = "";
    document.getElementById( "outputNDVI" ).src = "";
}

function setButtonEnable( buttonName, status ) {
    document.getElementById( buttonName ).disabled = !status;
}

function showProcessSpinner( status ) {
    if ( status ) {
        document.querySelectorAll( "#spinnerWrap" ).forEach( function( item ) {
            item.style = "display: block";
        } );
        
        document.querySelectorAll( "#processSpinner" ).forEach( function( item ) {
            item.classList.add( "is-active" );
        } );
    } else {
        document.querySelectorAll( "#spinnerWrap" ).forEach( function( item ) {
            item.style = "display: none";
        } );
        
        document.querySelectorAll( "#processSpinner" ).forEach( function( item ) {
            item.classList.remove( "is-active" );
        } );
    }
}

function resetSlider() {
    var sx = document.getElementById( "trueSliderX" );
    sx.min = 0;
    sx.max = SLIDER_WIDTH;
    sx.MaterialSlider.change( SLIDER_WIDTH / 2 );
    
    var sy = document.getElementById( "trueSliderY" );
    sy.min = 0;
    sy.max = SLIDER_WIDTH;
    sy.MaterialSlider.change( SLIDER_WIDTH / 2 );
}

function setSliderEnable( status ) {
    if ( status ) {
        document.querySelectorAll( ".mdl-slider" ).forEach( function( item ) {
            item.disabled = false;
        } );
    } else {
        document.querySelectorAll( ".mdl-slider" ).forEach( function( item ) {
            item.disabled = true;
        } );
    }
}
