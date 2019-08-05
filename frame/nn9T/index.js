// forked from itkr's "値を正しく表示したい [question]" http://jsdo.it/itkr/xu6d
var parent = document.getElementById('parent');
for(var i=0;i<5;i++){
    var newLi = document.createElement('li');
    var newA = document.createElement('a');
    newA.innerHTML = 'btn ' + i;
    newA.setAttribute('href','javascript:void(0)');
    //newA.setAttribute('href','javascript:alert(' + i + ')'); => イベントハンドラで指定したい
    //newA.onclick = function(e){alert(this.innerHTML);};      => 汎用的でない
    //newA.onclick = function(e){alert(i);}; //★ "0","1","2","3","4"と表示したい
    newA.onclick = (function(x) {
      return function() {
        alert(x);
      }
    })(i);
    
    newLi.appendChild(newA);
    parent.appendChild(newLi);
}