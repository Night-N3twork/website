let projectsData = [];

function getProjectElement(project) {
    const projectElement = document.createElement("div");
    projectElement.className = "project";
    projectElement.id = (project.name).toLowerCase().replace(/ /g, "-");
    let popupHTML = `
  <h3 class="subname">${project.name}</h3>
`
    if (project.image != null) {
        popupHTML += `<img class="project-image" src="${project.image}" />`
    }

    if (project.url != null) {
        popupHTML += `<a href="${project.url}" class="project-link"> Official Instance: ${project.name}</a>`
    }

    popupHTML += `<p class="description">${project.description}</p>`
    projectElement.addEventListener("click", () => {
        const dialog = document.createElement("dialog");
        dialog.classList.add("popup");
        dialog.id = "popup";
        let dialogHTML = `
        <button class="popup-close" id="popup-close">
            <span class="material-symbols-outlined">close</span>
        </button>
        ${popupHTML}`;
        dialog.innerHTML = dialogHTML;

        document.body.appendChild(dialog);

        dialog.showModal();

        document.getElementById("popup-close").addEventListener("click", () => {
            dialog.close();
            document.body.removeChild(dialog);
        });
    });

    const imgElement = document.createElement("img");
    imgElement.src = project.icon;

    const pElement = document.createElement("p");
    pElement.textContent = project.name;
    if (project.color != null){
        pElement.setAttribute("data-color", project.color);
        projectElement.addEventListener('mouseenter', function () {
            const color = pElement.getAttribute('data-color');
            pElement.style.color = color;
            projectElement.style.borderColor = color;
        });
    
        projectElement.addEventListener('mouseleave', function () {
            pElement.style.color = '#ffffff';
            projectElement.style.borderColor = "#ffffff";
        });
    }

    projectElement.appendChild(imgElement);
    projectElement.appendChild(pElement);

    return projectElement;
}

function renderProjects(filteredprojects = []) {
    const projectsGrid = document.getElementById("projectsGrid");
    projectsGrid.innerHTML = ``;

    filteredprojects.forEach((app) => {
        const projectElement = getProjectElement(app);
        projectsGrid.appendChild(projectElement);
    });
}


async function fetchGridData() {
    try {
        const response = await fetch("/assets/json/projects.json");
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
