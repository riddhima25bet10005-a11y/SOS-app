export let isLoggedIn = false;

export const setAuth = (status: boolean) => {
  isLoggedIn = status;
};

export const getAuth = () => {
  return isLoggedIn;
};
