let projectsData = [];

function getProjectElement(project) {
  const projectElement = document.createElement("div");
  projectElement.className = "devs-container";
  projectElement.id = (project.name).toLowerCase().replace(/ /g, "-");

  projectElement.addEventListener("click", () => {
    location.href = project.link;
  });

  const imgElement = document.createElement("div");
  imgElement.classList.add("dev-img");
  const img = document.createElement("img");
  img.classList.add("pfp");
  img.alt = "Profile Picture";
  img.src = project.pfp;
  imgElement.appendChild(img);

  const devName = document.createElement("div");
  devName.classList.add("dev-name");
  const name = document.createElement("h1");
  name.classList.add("name");
  name.textContent = project.name;
  if (project.color != null) {
    name.setAttribute("data-color", project.color);
    projectElement.addEventListener('mouseenter', function () {
      const color = name.getAttribute('data-color');
      name.style.color = color;
      // img.setAttribute("style", `border: 1px solid ${color};`);
    });

    projectElement.addEventListener('mouseleave', function () {
      name.style.color = '#ffffff';
      // img.setAttribute("style", `border: none;`);
    });
  }
  devName.appendChild(name);
  const pElement = document.createElement("p");
  pElement.textContent = project.title;
  pElement.classList.add("definition");
  devName.appendChild(pElement);

  projectElement.appendChild(imgElement);
  projectElement.appendChild(devName);

  return projectElement;
}

function renderProjects(filteredprojects = []) {
  const projectsGrid = document.getElementById("devGrid");
  projectsGrid.innerHTML = ``;

  filteredprojects.forEach((app) => {
    const projectElement = getProjectElement(app);
    projectsGrid.appendChild(projectElement);
  });
}


async function fetchGridData() {
  try {
    const response = await fetch("/assets/json/devs.json");
    projectsData = await response.json();
    return projectsData;
  } catch (error) {
    console.error("Error fetching JSON data:", error);
    return [];
  }
}

async function initializePage() {
  await fetchGridData();
  renderProjects(projectsData);

}

initializePage();
