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

const createAddUser = () => {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    const form = document.createElement('form');
    form.id = 'add-user-form';

    const handler = () => {
        const form = document.getElementById('add-user-form');

        const labels = form.getElementsByTagName('label');

        for (let i = 0; i < labels.length; i++) {
            document.getElementById(labels.item(i).id).remove();
        }
    }

    const nameInputGroup = document.createElement('div');
    nameInputGroup.classList.add('input-group');
    nameInputGroup.classList.add('has-validation');
    nameInputGroup.classList.add('mb-3');
    const nameInput = document.createElement('input');
    nameInput.name = 'name';
    nameInput.id = 'name';
    nameInput.classList.add('form-control');
    nameInput.placeholder = 'Name';
    nameInput.pattern = '^[a-zA-Z]{1}[a-zA-Z0-9]{4,}$';
    nameInput.required = true;
    nameInput.min = 5;
    nameInput.addEventListener('change', handler);
    nameInput.addEventListener('focus', handler);
    nameInputGroup.appendChild(nameInput);

    const roleInputGroup = document.createElement('div');
    roleInputGroup.classList.add('input-group');
    roleInputGroup.classList.add('has-validation');
    const roleInput = document.createElement('input');
    roleInput.name = 'role';
    roleInput.id = 'role';
    roleInput.classList.add('form-control');
    roleInput.placeholder = 'Role';
    roleInput.pattern = '^[a-z]{1}[a-z\ ]{4,}$';
    roleInput.required = true;
    roleInput.min = 5;
    roleInput.addEventListener('change', handler);
    roleInput.addEventListener('focus', handler);
    roleInputGroup.appendChild(roleInput);

    form.appendChild(nameInputGroup);
    form.appendChild(roleInputGroup);

    const actionCell = document.createElement('td');
    const saveButton = document.createElement('button');
    saveButton.classList.add('btn');
    saveButton.classList.add('btn-primary');
    const saveIcon = document.createElement('i');
    saveIcon.className = 'bi bi-save';

    saveButton.addEventListener('click', async () => {
        const form = document.getElementById('add-user-form');

        const inputs = form.getElementsByTagName('input');

        const errors = [];
        for (let i = 0; i < inputs.length; i++) {
            if (!inputs.item(i).checkValidity()) {
                errors.push({
                    field: inputs.item(i).id,
                    // @TODO: Different error messages for different error types?
                    error: 'Invalid input value'
                })
            }

        }

        if (errors.length === 0) {
            const json = {};
            new FormData(form).forEach((value, key) => {
                json[key] = value.valueOf();
            });

            try {
                const { statusCode, json: response } = await createPOST(`${urls.users}`, json);

                if (statusCode === 201) {
                    form.reset();
                    alert(`Created user with id ${response.id} at ${response.createdAt}`);
                }
            } catch (error) {
                console.log(error);
            }
        } else {
            errors.forEach(({ error, field }) => {
                const input = document.getElementById(field);
                const feedback = document.createElement('label');
                feedback.classList.add('invalid-feedback');
                feedback.classList.add('show');
                feedback.id = `${field}-error`;
                feedback.innerHTML = error;
                input.parentElement.appendChild(feedback);
            });
        }
    });

    saveButton.appendChild(saveIcon);
    actionCell.appendChild(saveButton);

    td.appendChild(form);
    tr.appendChild(td);
    tr.appendChild(actionCell);

    return tr;
}

const createTable = (response) => {
    cleanupTable();

    const table = document.getElementById('users-table');

    const tableBody = document.createElement('tbody');
    tableBody.id = 'users-table-body';

    const rows = response.data.map((user) => {
        const tr = document.createElement('tr');
        tr.classList.add('table-row-hover');

        // @TODO: Clicking only first name to display data is bad UX
        // If still needed move listener to the full name cell
        tr.addEventListener('click', async () => {
            const { statusCode, json: response } = await createGET(`${urls.users}/${user.id}`);

            if (statusCode === 200) {
                const cardImage = document.getElementById('card-image');
                cardImage.src = response.data.avatar;

                const cardName = document.getElementById('card-user-name');
                cardName.innerHTML = response.data.first_name + ' ' + response.data.last_name;

                const cardEmail = document.getElementById('card-user-email');
                cardEmail.innerHTML = response.data.email;

                const cardId = document.getElementById('card-user-id');
                cardId.innerHTML = response.data.id;

                const card = document.getElementById('user-card');
                card.classList.remove('hidden');
            }

            if (statusCode === 404) {
                alert('User not found!');
            }
        });

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
        editButton.addEventListener('click', (event) => {
            event.stopPropagation();
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
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
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
    tableBody.appendChild(createAddUser());

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
            alert('User updated!');
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