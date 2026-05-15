const nav = document.createElement('nav');
nav.innerHTML = `
    <a href="/">About</a>
    <div class="dropdown">
        <a href="#" class="dropdown-toggle">Projects</a>
        <div class="dropdown-menu">
            <a href="/coming_soon/">Generative Art</a>
            <a href="/coming_soon/">Juggling</a>
            <a href="/coming_soon/">Lost and Found</a>
        </div>
    </div>
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
