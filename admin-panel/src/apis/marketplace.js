
import {
  ALL_LISTITEMS,
} from './queries'
import config from '../config';

const getAllListItems = () => {
  return fetch(config.graph_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: ALL_LISTITEMS })
  })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error("Error fetching data");
      } else {
        return response.json();
      }
    })
    .then((data) => data.data?.listItems);
}

export {
  getAllListItems,
}
