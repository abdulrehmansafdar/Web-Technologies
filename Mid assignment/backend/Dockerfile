FROM php:8.1-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Enable CORS
RUN echo "Header set Access-Control-Allow-Origin \"*\"" >> /etc/apache2/apache2.conf
RUN echo "Header set Access-Control-Allow-Methods \"GET, POST, PUT, DELETE, OPTIONS\"" >> /etc/apache2/apache2.conf
RUN echo "Header set Access-Control-Allow-Headers \"Content-Type, Authorization\"" >> /etc/apache2/apache2.conf

# Install headers module
RUN a2enmod headers

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

EXPOSE 80
