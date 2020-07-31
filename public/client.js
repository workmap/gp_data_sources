console.log('Client-side code running');

const button = document.getElementById('myButton');
button.addEventListener('click', function(e) {
  console.log('E: ', e)
  $.get('http://localhost:8081/compareData', function(msg) {
    $('#msg').html(msg); // show the list
  });
});