const globalState = new Proxy({
    page: 1,
    pageSize: 6,
    totalPages: null,
    total: null,
    editModalOpen: false,
    deleteModalOpen: false,
    userId: null,
}, {
    set(target, propName, newValue) {
        const result = Reflect.set(target, propName, newValue);

        if (propName === 'deleteModalOpen') {
            const modal = document.getElementById('delete-modal');
            if (newValue === true) {
                modal.classList.add('show');
            } else {
                modal.classList.remove('show');
            }
        }

        if (propName === 'editModalOpen') {
            const modal = document.getElementById('edit-modal');
            if (newValue === true) {
                modal.classList.add('show');
            } else {
                modal.classList.remove('show');
            }
        }

        if (propName === 'page' || propName === 'pageSize') {
            renderTable();
        }

        if (propName === 'userId' && newValue === null) {
            renderTable();
        }

        return result;
    }
});

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

    const url = `${urls.users}?${searchParams.toString()}`

    const { json: response } = await createGET(url);

    loader.classList.add('hidden');

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

const cleanupTable = () => {
    const tableBody = document.getElementById('users-table-body');
    tableBody.remove();
}

const createTable = (response) => {
    cleanupTable();

    const table = document.getElementById('users-table');

    const tableBody = document.createElement('tbody');
    tableBody.id = 'users-table-body';

    const rows = response.data.map((user) => {
        const tr = document.createElement('tr');
        tr.classList.add('table-row-hover');

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
        editButton.addEventListener('click', () => {
            globalState.editModalOpen = true;
            globalState.userId = user.id;
        });
        editButton.appendChild(editIcon);
        actionElement.appendChild(editButton);

        const deleteButton = document.createElement('button');
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'bi bi-trash';
        deleteButton.classList.add('btn');
        deleteButton.classList.add('btn-danger');
        deleteButton.addEventListener('click', () => {
            globalState.deleteModalOpen = true;
            globalState.userId = user.id;
        });
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

const cleanupPagination = () => {
    const pagination = document.getElementById('users-table-pagination');
    pagination.remove();
}

const createTableActions = (response) => {
    const pageCount = response.total_pages;
    const page = response.page;

    cleanupPagination();

    const nav = document.getElementById('pagination-nav');
    const pagination = document.createElement('ul');
    pagination.id = 'users-table-pagination';
    pagination.classList.add('pagination');

    const prev = document.createElement('li');
    prev.id = 'prev-button'
    prev.classList.add('page-item');

    if (page === 1) {
        prev.classList.add('disabled');
    }

    const prevLink = document.createElement('a');
    prevLink.classList.add('page-link');
    prevLink.href = '#';
    prevLink.innerHTML = '&laquo;';
    prevLink.setAttribute('aria-hidden', true);

    prevLink.addEventListener('click', async (event) => {
        event.preventDefault();

        globalState.page = globalState.page - 1;
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
    if (page === pageCount) {
        next.classList.add('disabled');
    }
    nextLink.href = '#';
    nextLink.innerHTML = '&raquo;';
    nextLink.setAttribute('aria-hidden', true);

    nextLink.addEventListener('click', async (event) => {
        event.preventDefault();

        globalState.page = globalState.page + 1;
    });

    next.appendChild(nextLink);
    pagination.appendChild(next);
    nav.appendChild(pagination);
}

const createDeleteModal = () => {
    const closeIconButton = document.getElementById('close-delete-modal');
    closeIconButton.addEventListener('click', () => {
        globalState.deleteModalOpen = false;
        globalState.userId = null;
    });

    const cancelButton = document.getElementById('cancel-delete');
    cancelButton.addEventListener('click', () => {
        globalState.deleteModalOpen = false;
        globalState.userId = null;
    });

    const deleteButton = document.getElementById('user-delete');
    deleteButton.addEventListener('click', async () => {
        const response = await createDELETE(`${urls.users}/${globalState.userId}`);

        if (response.statusCode === 204) {
            globalState.deleteModalOpen = false;
            globalState.userId = null;
            alert('User deleted!');
        }
    });
}

const createEditModal = () => {
    const closeIconButton = document.getElementById('close-edit-modal');
    closeIconButton.addEventListener('click', () => {
        globalState.editModalOpen = false;
        globalState.userId = null;
    });

    const cancelButton = document.getElementById('cancel-edit');
    cancelButton.addEventListener('click', () => {
        globalState.editModalOpen = false;
        globalState.userId = null;
    });

    const editButton = document.getElementById('user-edit');
    editButton.addEventListener('click', async () => {
        const form = document.getElementById('edit-user-form');

        const json = {};
        new FormData(form).forEach((value, key) => {
            json[key] = value.valueOf();
        });

        const response = await createPUT(`${urls.users}/${globalState.userId}`, json);

        if (response.statusCode === 200) {
            globalState.editModalOpen = false;
            globalState.userId = null;
            form.reset();
        }
    });
}

const createPageSizeSelect = async () => {
    const select = document.getElementById('page-size-selector');

    select.value = globalState.pageSize;

    select.addEventListener('change', async (event) => {
        globalState.pageSize = Number(event.target.value);
    });
}

(async function () {
    await renderTable();

    createPageSizeSelect();
    createDeleteModal();
    createEditModal();
})()