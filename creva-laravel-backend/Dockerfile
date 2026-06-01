FROM php:8.2-apache

# Install system dependencies and PostgreSQL PHP extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && a2enmod rewrite headers \
    && echo "Header always set Access-Control-Allow-Origin '*'" >> /etc/apache2/apache2.conf \
    && echo "Header always set Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS'" >> /etc/apache2/apache2.conf \
    && echo "Header always set Access-Control-Allow-Headers 'Authorization, Content-Type, Accept, X-Requested-With'" >> /etc/apache2/apache2.conf

# Configure Apache DocumentRoot to point to public/
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p public/uploads \
    && chown -R www-data:www-data public/uploads \
    && chmod -R 775 public/uploads

# Expose port 80
EXPOSE 80
