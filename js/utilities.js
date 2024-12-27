const urls = {
    getUsers: 'https://reqres.in/api/users',
}

const createRequest = (method, url) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    return xhr;
}

const sendRequest = (method, url) => {
    return new Promise((resolve, reject) => {
        const request = createRequest(method, url);

        request.onloadend = () => {
            try {
                const json = JSON.parse(request.response);

                resolve(json);
            } catch (error) {
                reject(error);
            }
        }

        request.onabort = (event) => {
            reject(event);
        }

        request.onerror = (event) => {
            reject(event);
        }

        request.send();
    });
}

const createGET = (url) => {
    return sendRequest('GET', url);
}

const createDELETE = (url) => {
    return sendRequest('DELETE', url);
}

const createPOST = (url) => {
    return sendRequest('POST', url);
}

const createPUT = (url) => {
    return sendRequest('PUT', url);
}
