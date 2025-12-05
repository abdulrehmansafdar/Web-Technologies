FROM nginx:alpine

# Remove default config and copy a basic one that will serve static files
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy static file contents
COPY ./ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
