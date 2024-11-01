// All actions are processing sequentially using a request queue,
// to avoid transactional contention.
// https://github.com/typeorm/typeorm/issues/1884
const requestQueue = []
let requestIsRunning = false
let _dataSource; // initialized elsewhere

export function queueRequest (request) {
  return new Promise((resolve, reject) => {
    if (requestIsRunning) {
      requestQueue.push([request, resolve, reject])
      return
    }
    requestIsRunning = true
    processRequest(request, resolve, reject)
  })
}

// for troubleshooting
export function requestWaitCount () {
  return requestQueue.length
}

function processRequest (request, resolve, reject) {
  // console.log('execute next db request')
  request()
    .then(resolve, reject)
    .finally(() => {
      // console.log('completed executing db request')
      const nextItem: [() => Promise<any>, (value?: any) => void, (reason?: any) => void] | undefined = requestQueue.shift()
      if (nextItem) {
        processRequest(...(nextItem as [() => Promise<any>, (value?: any) => void, (reason?: any) => void]))
      } else {
        requestIsRunning = false
      }
    })
}

export function getDataSource(dataSourceCallback) {
    if (!_dataSource) return Promise.reject(new Error('Data source not yet created'));

    return queueRequest(() => Promise.resolve(_dataSource).then(dataSourceCallback));
}

export function setDataSource(dataSource) {
    _dataSource = dataSource;
}