const nav = document.createElement('nav');
nav.innerHTML = `
    <a href="/">About</a>
`;
document.body.prepend(nav);

const toggle = nav.querySelector('.dropdown-toggle');
const dropdown = nav.querySelector('.dropdown');

toggle.addEventListener('click', (e) => {
    e.preventDefault();
    dropdown.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
    }
});
