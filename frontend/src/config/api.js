const API_BASE = import.meta.env.PROD
	? `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_API_URL}`
	: `${import.meta.env.VITE_API_PROTOKOLL}://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_API_PORT}`;

export default API_BASE;
