import axios from "axios";

const EXTERNAL_CONTROLLER_PORT = process.env.EXTERNAL_CONTROLLER_PORT || 9090;

export const updateConfig = (payload: string) => {
  return axios.request({
    method: "put",
    url: "http://127.0.0.1:9090/configs",
    data: { path: "", payload },
    timeout: 5 * 60 * 1000,
  });
};

export const healthCheck = async (
  proxyName: string,
  testUrl: string = "https://google.com/generate_204",
  timeout: number = 5000
): Promise<number> => {
  const url = `http://127.0.0.1:${EXTERNAL_CONTROLLER_PORT}/proxies/${encodeURIComponent(
    proxyName
  )}/delay?url=${encodeURIComponent(testUrl)}&timeout=${timeout}`;
  try {
    const { delay } = await axios
      .request({
        method: "get",
        url,
        timeout: timeout + 1000,
      })
      .then((response) => response.data);
    return delay > 0 ? delay : -1;
  } catch (error) {
    return -1;
  }
};
