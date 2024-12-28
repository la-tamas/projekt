const urls = {
    users: 'https://reqres.in/api/users',
}

const createRequest = (method, url) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    return xhr;
}

const sendRequest = (method, url, data) => {
    return new Promise((resolve, reject) => {
        const request = createRequest(method, url);

        if (data) {
            request.setRequestHeader('Content-Type', 'application/json');
        }

        request.onloadend = () => {
            try {
                let json = {};

                if (request.response) {
                    json = JSON.parse(request.response);
                }

                resolve({
                    statusCode: request.status,
                    json,
                });
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

        request.send(data ? JSON.stringify(data) : null);
    });
}

const createGET = (url) => {
    return sendRequest('GET', url);
}

const createDELETE = (url) => {
    return sendRequest('DELETE', url);
}

const createPOST = (url, data) => {
    return sendRequest('POST', url, data);
}

const createPUT = (url, data) => {
    return sendRequest('PUT', url, data);
}
