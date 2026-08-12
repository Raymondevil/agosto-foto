-- Insertar datos iniciales en la galería
INSERT INTO gallery (id, title, category, date, type, url, video_url, description, price, dorsal, high_res_url)
VALUES
  ('g1', 'La Gran Topadera', 'topaderas', '16 de Septiembre', 'photo', '/static/photos/h17final25.jpg', NULL, 'Captura congelada en el ruedo', 50, '12', NULL),
  ('g2', 'Cabalgata Charra', 'cabalgatas', '14 de Septiembre', 'photo', '/static/photos/h18final249.jpg', NULL, 'Jinetes tradicionales', 50, '45', NULL),
  ('g3', 'Fuegos Artificiales', 'grito', '15 de Septiembre', 'photo', '/static/photos/h18final249.jpg', NULL, 'Noche del Grito', 50, 'Grito2026', NULL);

-- Insertar un pedido de ejemplo
INSERT INTO orders (id, client_name, phone, video_pass, photo_count, selected_photo_ids, selected_events, notes, total, status, payment_method, payment_status)
VALUES
  ('TIG-1001', 'Don José Ramos', '3111234567', 1, 4, '["g1","g2"]', '["Topaderas","Noche del Grito"]', 'Busco fotos de cabalgata', 800, 'Pagado', 'Mercado Pago', 'Aprobado');
