const globalState = {
    page: null,
    totalPages: null,
    pageSize: null,
    total: null,
    editModalOpen: false,
}

const loadUsers = async () => {
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');

    const searchParams = new URLSearchParams();

    if (globalState.page !== null) {
        searchParams.append('page', globalState.page);
    }
    
    if (globalState.pageSize !== null) {
        searchParams.append('per_page', globalState.pageSize);
    }

    const url = `${urls.getUsers}?${searchParams.toString()}`

    const response = await createGET(url);

    loader.classList.add('hidden');

    globalState.page = response.page;
    globalState.pageSize = response.per_page;
    globalState.total = response.total;
    globalState.totalPages = response.total_pages;

    return response;
}

const renderTable = async () => {
    const response = await loadUsers();

    createTable(response);
    createTableActions(response);

    return response;
}

const createTable = (response) => {
    let tableBody = document.getElementById('users-table-body');
    tableBody.remove();

    const table = document.getElementById('users-table');

    tableBody = document.createElement('tbody');
    tableBody.id = 'users-table-body';

    const rows = response.data.map((user) => {
        const tr = document.createElement('tr');

        const idElement = document.createElement('td');
        idElement.innerHTML = user.id;

        const avatarElement = document.createElement('td');
        const img = document.createElement('img');
        img.src = user.avatar;
        avatarElement.appendChild(img);

        const emailElement = document.createElement('td');
        emailElement.innerHTML = user.email;

        const nameElement = document.createElement('td');
        nameElement.innerHTML = user.first_name + ' ' + user.last_name;

        const actionElement = document.createElement('td');

        const editButton = document.createElement('button');
        const editIcon = document.createElement('i');
        editIcon.className = 'bi bi-pencil';
        editButton.classList.add('btn');
        editButton.classList.add('btn-info');
        editButton.appendChild(editIcon);
        actionElement.appendChild(editButton);

        const deleteButton = document.createElement('button');
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'bi bi-trash';
        deleteButton.classList.add('btn');
        deleteButton.classList.add('btn-danger');
        deleteButton.appendChild(deleteIcon);
        actionElement.appendChild(deleteButton);

        tr.appendChild(idElement);
        tr.appendChild(avatarElement);
        tr.appendChild(nameElement);
        tr.appendChild(emailElement);
        tr.appendChild(actionElement);

        return tr;
    });

    rows.forEach(row => tableBody.appendChild(row));

    table.appendChild(tableBody);
}

const createTableActions = (response) => {
    const pageCount = response.total_pages;
    const page = response.page;

    const nav = document.getElementById('pagination-nav');
    let pagination = document.getElementById('users-table-pagination');

    for (let i = 0; i < pagination.children.length; i++) {
        pagination.children.item(i).remove();
    }

    pagination.remove();

    pagination = document.createElement('ul');
    pagination.classList.add('pagination');

    const prev = document.createElement('li');
    prev.id = 'prev-button'
    prev.classList.add('page-item');
    prev.classList.add('disabled');
    const prevLink = document.createElement('a');
    prevLink.classList.add('page-link');
    prevLink.href = '#';
    prevLink.innerHTML = '&laquo;';
    prevLink.setAttribute('aria-hidden', true);

    prevLink.addEventListener('click', async (event) => {
        event.preventDefault();

        globalState.page = globalState.page - 1;

        const response = await renderTable();

        if (1 === response.total_pages) {
            const prev = document.getElementById('prev-button');
            prev.classList.add('disabled')
        }
    });

    prev.appendChild(prevLink);
    pagination.appendChild(prev);

    for (let i = 1; i <= pageCount; i++) {
        const listItem = document.createElement('li');
        listItem.classList.add('page-item');
        const link = document.createElement('a');
        link.classList.add('page-link');
        link.innerHTML = `${i}`;
        link.href="#";

        if (i === globalState.page) {
            listItem.classList.add('active');
        }

        link.addEventListener('click', async (event) => {
            event.preventDefault();

            globalState.page = i;

            const response = await renderTable();

            for (let i = 0; i < pagination.children.length; i++) {
                const child = pagination.children.item(i);

                child.classList.remove('active');
                child.classList.remove('disabled');
            }

            if (1 === response.page) {
                const prev = document.getElementById('prev-button');
                prev.classList.add('disabled')
            }

            if (globalState.page === response.total_pages) {
                const next = document.getElementById('next-button');
                next.classList.add('disabled')
            }

            link.parentElement.classList.add('active');
        });

        if (page === i) {
            listItem.classList.add('active');
        }

        listItem.appendChild(link);
        pagination.appendChild(listItem);
    }

    const next = document.createElement('li');
    next.id = 'next-button'
    next.classList.add('page-item');
    const nextLink = document.createElement('a');
    nextLink.classList.add('page-link');
    nextLink.href = '#';
    nextLink.innerHTML = '&raquo;';
    nextLink.setAttribute('aria-hidden', true);

    nextLink.addEventListener('click', async (event) => {
        event.preventDefault();

        globalState.page = globalState.page + 1;

        const response = await renderTable();

        if (globalState.page === response.total_pages) {
            const next = document.getElementById('next-button');
            next.classList.add('disabled')
        }
    });

    next.appendChild(nextLink);
    pagination.appendChild(next);
    nav.appendChild(pagination);
}

const createPageSizeSelect = async () => {
    const select = document.getElementById('page-size-selector');

    select.value = globalState.pageSize;

    select.addEventListener('change', async (event) => {
        globalState.pageSize = Number(event.target.value);

        await renderTable();
    });
}

(async function () {
    await renderTable();

    createPageSizeSelect();
})()