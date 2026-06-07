FROM php:8.2-apache

# Install system dependencies and PostgreSQL PHP extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && a2enmod rewrite headers

# Configure Apache DocumentRoot to point to public/
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    && sed -ri -e 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# CORS is handled dynamically in public/index.php (dynamic origin matching, credentials support).
# Do NOT add Apache-level CORS headers here — Header always set with '*' overwrites PHP headers
# and is forbidden by browsers when credentials:'include' is used.

# Set working directory
WORKDIR /var/www/html

# Cache-bust: forces Docker to re-copy all files on every build
ARG CACHE_BUST=20260607b
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p public/uploads \
    && chown -R www-data:www-data public/uploads \
    && chmod -R 775 public/uploads

# Expose port 80
EXPOSE 80
