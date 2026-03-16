import { API_URL } from "../config";
import { useInfoStore } from "../stores/info";

export async function fetchData(url, bodyValues = {}, method = 'GET', options = null) {
  const data = {
    data: null,
    externalError: null,
    internalError: null,
  };

  if (method === 'GET' && bodyValues && Object.keys(bodyValues).length) {
    const val = new URLSearchParams();
    for (const key in bodyValues) {
      if (bodyValues[key] !== undefined) {
        if (typeof bodyValues[key] === 'boolean') {
          val.append(key, bodyValues[key] ? '1' : '0');
        } else {
          val.append(key, bodyValues[key]);
        }
      }
    }
    url += '?' + val.toString();
  }

  try {
    const response = await fetch(API_URL + url, {
      method,
      // headers: { 'Content-Type': 'application/json' },
      // body: bodyValues ? JSON.stringify(bodyValues) : null,
      body: method === 'GET' ? undefined : (bodyValues ? Object.keys(bodyValues).reduce((val, key) => {
        if (bodyValues[key] !== undefined) {
          if (typeof bodyValues[key] === 'boolean') {
            val.append(key, bodyValues[key] ? '1' : '0');
          } else if (bodyValues[key] instanceof File) {
            // console.log('File detected:', bodyValues[key]);
            val.append(key, bodyValues[key]);
          } else {
            val.append(key, bodyValues[key]);
          }
        }
        return val;
      }, new FormData()) : null),
      ...{ ...options, files: undefined },
    });
    try {
      data.data = await response.json();
    } catch {
      data.data = await response.text();
    }
    if (!response.ok) {
      data.externalError = data.data;
      data.data = null;
    }
  } catch (error) {
    data.internalError = error;
  }
  return data;
}

export function handleRequestResponse(response, successCallback = null, errorCallback = null) {
  const infoStore = useInfoStore();

  if (response === null || response === undefined) {
    console.log('handleResponse called with null or undefined response');
    return;
  }

  if (response.data) {
    if (successCallback) {
      const shouldReturn = successCallback(response.data);
      if (shouldReturn === true || shouldReturn === undefined) {
        return;
      }
    }
    infoStore.addAppInfo(response.data?.info);
    return;
  }
  if (errorCallback) {
    const shouldReturn = errorCallback(response.externalError ?? response.internalError);
    if (shouldReturn === true || shouldReturn === undefined) {
      return;
    }
  }
  if (response.externalError || response.data) {
    infoStore.addAppInfo(response.externalError?.info ?? response.data?.info);
  } else {
    infoStore.addAppInfo('ERROR_OCCURED');
    console.log('Internal error, request response:', response);
  }
}

export function arrayRemoveAtIndex(array, index) {
  array.splice(index, 1);
}

export function arrayRemoveElement(array, element) {
  const index = array.indexOf(element);
  if (index > -1)
    arrayRemoveAtIndex(array, index);
}

export async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isDateValid(dateStr) {
  return !isNaN(new Date(dateStr));
}

export function dateString(date) {
  if (!(date instanceof Date))
    date = new Date(date);
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`
}

export function timeString(date, withSeconds = true) {
  if (!(date instanceof Date))
    date = new Date(date);
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}${withSeconds ? `:${padZero(date.getSeconds())}` : ''}`
}

export function padZero(num) {
  return num.toString().padStart(2, '0');
}

export function dateTimeInput(date, withSeconds = false) {
  if (!date)
    date = new Date();
  else if (!(date instanceof Date))
    date = new Date(date);
  return `${date.toLocaleDateString('en-CA')}T${timeString(date, withSeconds)}`;
}

export function randomMinMax(minValIncluded, maxValIncluded) {
  return minValIncluded + Math.floor(Math.random() * (maxValIncluded + 1 - minValIncluded));
}
