-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-07-2025 a las 03:03:06
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `ecommerce-shop`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `nombre_producto` varchar(50) NOT NULL,
  `categoria_producto` varchar(50) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `estado` enum('pendiente','enviado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id`, `usuario_id`, `producto_id`, `nombre_producto`, `categoria_producto`, `cantidad`, `estado`, `creacion`) VALUES
(1, 1, 28, 'Intel Core i9-13900K', 'Componentes', 1, 'cancelado', '2025-06-03 12:07:51'),
(2, 1, 28, 'Intel Core i9-13900K', 'Componentes', 5, 'cancelado', '2025-06-03 12:08:26'),
(3, 1, 28, 'Intel Core i9-13900K', 'Componentes', 4, 'cancelado', '2025-06-03 12:10:45'),
(4, 1, 1, 'Poco X3 Pro', 'Electrónica', 1, 'cancelado', '2025-06-03 15:19:24'),
(5, 1, 3, 'iPhone 14 Pro', 'Electrónica', 1, 'cancelado', '2025-06-03 15:23:34');

--
-- Disparadores `pedidos`
--
DELIMITER $$
CREATE TRIGGER `descontar_stock_pedido` AFTER INSERT ON `pedidos` FOR EACH ROW BEGIN
  UPDATE productos
  SET stock = stock - NEW.cantidad
  WHERE id = NEW.producto_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `reponer_stock_cancelado` AFTER UPDATE ON `pedidos` FOR EACH ROW BEGIN
  IF OLD.estado <> 'cancelado' AND NEW.estado = 'cancelado' THEN
    UPDATE productos
    SET stock = stock + NEW.cantidad
    WHERE id = NEW.producto_id;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(255) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `subcategoria` varchar(50) NOT NULL,
  `precio` double NOT NULL,
  `stock` int(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `categoria`, `subcategoria`, `precio`, `stock`) VALUES
(1, 'Poco X3 Pro', 'Último modelo con cámara de 48MP y 128GB de almacenamiento', 'Electrónica', 'Smartphones', 599.99, 50),
(2, 'Laptop ASUS Vivobook 16x', '32GB RAM, SSD 1TB, RTX 4050, i9 13900H', 'Computadoras', 'Laptops', 999.99, 30),
(3, 'iPhone 14 Pro', 'Pantalla Super Retina XDR, 256GB, cámara triple', 'Electrónica', 'Smartphones', 1299.99, 40),
(4, 'Samsung Galaxy S23', 'Snapdragon 8 Gen 2, 128GB, cámara de 50MP', 'Electrónica', 'Smartphones', 1199.99, 45),
(5, 'Monitor LG 27\"', 'Resolución 4K UHD, IPS, HDR10', 'Electrónica', 'Monitores', 349.99, 20),
(6, 'Teclado Mecánico Logitech G Pro', 'Interruptores GX Blue, RGB', 'Periféricos', 'Teclados', 129.99, 60),
(7, 'Mouse Logitech MX Master 3S', 'Sensor de alta precisión, Bluetooth', 'Periféricos', 'Ratones', 99.99, 70),
(8, 'Tablet Samsung Galaxy Tab S8', '11\" LCD, 256GB, Snapdragon 8 Gen 1', 'Electrónica', 'Tablets', 799.99, 25),
(9, 'Disco Duro Externo WD 2TB', 'USB 3.0, compatible con Windows y Mac', 'Almacenamiento', 'Discos Duros', 89.99, 80),
(10, 'SSD NVMe Samsung 980 Pro 1TB', 'Lectura hasta 7000MB/s, PCIe Gen4', 'Almacenamiento', 'SSD', 159.99, 50),
(11, 'Procesador AMD Ryzen 7 5800X', '8 núcleos, 16 hilos, AM4', 'Componentes', 'Procesadores', 299.99, 35),
(12, 'Placa Madre ASUS ROG Strix B550-F', 'Soporte Ryzen, WiFi 6, ATX', 'Componentes', 'Placas Madre', 199.99, 40),
(13, 'Memoria RAM Corsair Vengeance 32GB', 'DDR4, 3600MHz, RGB', 'Componentes', 'Memorias RAM', 129.99, 65),
(14, 'Tarjeta Gráfica NVIDIA RTX 4070', '12GB GDDR6X, Ray Tracing', 'Componentes', 'Tarjetas Gráficas', 699.99, 15),
(15, 'Fuente de Poder EVGA 750W Gold', 'Modular, certificación 80+ Gold', 'Componentes', 'Fuentes de Poder', 119.99, 30),
(16, 'Gabinete NZXT H510', 'ATX, con vidrio templado', 'Componentes', 'Gabinetes', 99.99, 25),
(17, 'Laptop Lenovo Legion 5', 'Ryzen 7, RTX 3060, 16GB RAM, SSD 512GB', 'Computadoras', 'Laptops', 1199.99, 20),
(18, 'Smartwatch Amazfit GTR 4', 'GPS, monitoreo de salud, AMOLED', 'Electrónica', 'Relojes Inteligentes', 199.99, 50),
(19, 'Auriculares Sony WH-1000XM5', 'Cancelación de ruido, Bluetooth 5.2', 'Electrónica', 'Auriculares', 349.99, 45),
(20, 'Impresora HP LaserJet Pro M404dn', 'Impresión láser monocromática, Ethernet', 'Periféricos', 'Impresoras', 249.99, 10),
(21, 'Xiaomi Redmi Note 12 Pro', '256GB, 108MP cámara, AMOLED 120Hz', 'Electrónica', 'Smartphones', 399.99, 55),
(22, 'MacBook Air M2', '8GB RAM, SSD 512GB, Chip M2', 'Computadoras', 'Laptops', 1299.99, 25),
(23, 'Monitor Samsung Odyssey G7', '32\" Curvo, 240Hz, QHD', 'Electrónica', 'Monitores', 649.99, 15),
(24, 'Teclado Razer BlackWidow V3', 'Switches Green, RGB Chroma', 'Periféricos', 'Teclados', 149.99, 40),
(25, 'Mouse Razer DeathAdder V3', 'Sensor Focus Pro 30K, RGB', 'Periféricos', 'Ratones', 79.99, 60),
(26, 'iPad Pro 12.9\" M2', 'Chip M2, 256GB, WiFi + 5G', 'Electrónica', 'Tablets', 1299.99, 20),
(27, 'SSD Samsung 990 Pro 2TB', 'PCIe 4.0, 7450MB/s lectura', 'Almacenamiento', 'SSD', 249.99, 45),
(28, 'Intel Core i9-13900K', '24 núcleos, 32 hilos, LGA 1700', 'Componentes', 'Procesadores', 599.99, 10),
(29, 'MSI MPG B650 EDGE', 'AM5, DDR5, PCIe 5.0', 'Componentes', 'Placas Madre', 279.99, 35),
(30, 'GPU NVIDIA RTX 4080', '16GB GDDR6X, DLSS 3.0', 'Componentes', 'Tarjetas Gráficas', 1199.99, 10),
(31, 'RAM G.Skill Trident Z5', 'DDR5 6000MHz, 32GB (2x16GB)', 'Componentes', 'Memorias RAM', 189.99, 50),
(32, 'Corsair RM850x', '850W, 80+ Gold, Full Modular', 'Componentes', 'Fuentes de Poder', 149.99, 40),
(33, 'Lian Li O11 Dynamic EVO', 'E-ATX, Triple radiador', 'Componentes', 'Gabinetes', 169.99, 20),
(34, 'Google Pixel 8 Pro', '256GB, cámara 50MP, Android 14', 'Electrónica', 'Smartphones', 999.99, 30),
(35, 'ROG Zephyrus G14', 'Ryzen 9, RX 7600HS, 32GB RAM', 'Computadoras', 'Laptops', 1699.99, 15),
(36, 'Apple Watch Series 9', 'GPS + Cellular, 45mm, Always-On', 'Electrónica', 'Relojes Inteligentes', 499.99, 40),
(37, 'AirPods Pro 2', 'Cancelación activa, Audio espacial', 'Electrónica', 'Auriculares', 249.99, 60),
(38, 'Monitor Dell UltraSharp U2723QE', '27\" 4K IPS, USB-C Hub', 'Electrónica', 'Monitores', 699.99, 25),
(39, 'Canon PIXMA G7020', 'Tanque de tinta, Wi-Fi, Duplex', 'Periféricos', 'Impresoras', 349.99, 20),
(40, 'HDD Seagate IronWolf Pro 8TB', 'NAS, 7200RPM, CMR', 'Almacenamiento', 'Discos Duros', 249.99, 30);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `correo`, `contrasena`, `creacion`) VALUES
(1, 'Alexis', 'Chimba', 'alexis.santy07@gmail.com', 'kausa', '2025-06-03 11:53:36');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
