particlesJS('background', {
	"particles": {
		"number": {
			"value": 300,
			"density": {
				"enable": true,
				"value_area": 850
			}
		},
		"color": {
			"value": "#ffffff"
		},
		"shape": {
			"type": "circle",
			"stroke": {
				"width": 0,
				"color": "#000000"
			},
			"polygon": {
				"nb_sides": 5
			},
			"image": {
				"src": "img/github.svg",
				"width": 100,
				"height": 100
			}
		},
		"opacity": {
			"value": 0.5,
			"random": true,
			"anim": {
				"enable": true,
				"speed": 1,
				"opacity_min": 0.1,
				"sync": false
			}
		},
		"size": {
			"value": 2,
			"random": true,
			"anim": {
				"enable": true,
				"speed": 1,
				"size_min": 0.1,
				"sync": false
			}
		},
		"line_linked": {
			"enable": false,
			"distance": 150,
			"color": "#ffffff",
			"opacity": 0.4,
			"width": 1
		},
		"move": {
			"enable": true,
			"speed": 0.5,
			"direction": "top",
			"random": false,
			"straight": true,
			"out_mode": "out",
			"bounce": false,
			"attract": {
				"enable": false,
				"rotateX": 600,
				"rotateY": 1200
			}
		}
	},
	"interactivity": {
		"detect_on": "window",
		"events": {
			"onhover": {
				"enable": false,
				"mode": "repulse"
			},
			"onclick": {
				"enable": true,
				"mode": "repulse"
			},
			"resize": true
		},
		"modes": {
			"grab": {
				"distance": 400,
				"line_linked": {
					"opacity": 1
				}
			},
			"bubble": {
				"distance": 400,
				"size": 40,
				"duration": 2,
				"opacity": 8,
				"speed": 3
			},
			"repulse": {
				"distance": 200,
				"duration": 0.4
			},
			"push": {
				"particles_nb": 4
			},
			"remove": {
				"particles_nb": 2
			}
		}
	},
	"retina_detect": true
});
/*
function updateTime() {
	var dateInfo = new Date();

	
	var hr,
	  _min = (dateInfo.getMinutes() < 10) ? "0" + dateInfo.getMinutes() : dateInfo.getMinutes(),
	  sec = (dateInfo.getSeconds() < 10) ? "0" + dateInfo.getSeconds() : dateInfo.getSeconds(),
	  ampm = (dateInfo.getHours() >= 12) ? "PM" : "AM";
  
	if (dateInfo.getHours() == 0) {
	  hr = 12;
	} else if (dateInfo.getHours() > 12) {
	  hr = dateInfo.getHours() - 12;
	} else {
	  hr = dateInfo.getHours();
	}
  
	var currentTime = hr + ":" + _min + ":" + sec;
  
	// print time
	document.querySelector(".time").innerHTML = currentTime + ampm;
  
	// store date
	var currentDate = (dateInfo.getMonth() + "/" +  dateInfo.getDate() + "/" + dateInfo.getFullYear());
  
	document.querySelector(".date").innerHTML = currentDate;
  };
  
  updateTime();
  setInterval(function() {
	updateTime()
  }, 1000);
*/
/*
var shape = document.querySelector(".navShape")
$("#home").on("mouseover", function () {
	console.log("home is hovered!")
	if (shape.style.opacity = "0"){
		shape.style.opacity = "1"
		
	}
	shape.style.width = "90px"
	shape.style.left = "-498px"

});*/

