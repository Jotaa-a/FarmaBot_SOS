CREATE DATABASE IF NOT EXISTS drogueria
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE drogueria;

DROP TABLE IF EXISTS producto;

CREATE TABLE producto (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    usos        TEXT NOT NULL,
) ENGINE = InnoDB;


INSERT INTO producto (nombre, descripcion, usos) VALUES
('Acetaminofén 500mg', 'Analgésico y antipirético de uso común, en tabletas de 500mg.', 'Dolor de cabeza, fiebre, dolor muscular leve, malestar general'),
('Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo (AINE) en tabletas de 400mg.', 'Dolor de cabeza, inflamación, dolor muscular, dolor menstrual, fiebre'),
('Ácido acetilsalicílico 500mg', 'Analgésico, antipirético y antiinflamatorio derivado de la aspirina.', 'Dolor leve a moderado, fiebre, dolor de cabeza, dolor muscular'),
('Loratadina 10mg', 'Antihistamínico de segunda generación, no sedante.', 'Alergias, rinitis alérgica, estornudos, picazón en ojos y nariz, urticaria'),
('Clorfenamina 4mg', 'Antihistamínico de primera generación.', 'Alergias, rinitis, estornudos, picazón, secreción nasal, reacciones alérgicas leves'),
('Diclofenaco 50mg', 'Antiinflamatorio no esteroideo de uso frecuente en dolores musculares.', 'Dolor muscular, dolor articular, inflamación, dolor de espalda'),
('Naproxeno 250mg', 'AINE de acción prolongada.', 'Dolor menstrual, dolor muscular, dolor articular, inflamación'),
('Omeprazol 20mg', 'Inhibidor de la bomba de protones, reduce la acidez estomacal.', 'Acidez estomacal, reflujo, gastritis, ardor, indigestión'),
('Hidróxido de aluminio y magnesio', 'Antiácido de acción rápida en suspensión o tabletas masticables.', 'Acidez, agruras, indigestión, malestar estomacal'),
('Simeticona 80mg', 'Agente antiflatulento que reduce los gases intestinales.', 'Gases, distensión abdominal, cólicos, flatulencia'),
('Loperamida 2mg', 'Antidiarreico que reduce el movimiento intestinal.', 'Diarrea aguda, diarrea del viajero'),
('Sales de rehidratación oral', 'Sobres para disolver en agua, reponen electrolitos.', 'Deshidratación, diarrea, vómito, pérdida de líquidos'),
('Dimenhidrinato 50mg', 'Antihistamínico usado como antiemético.', 'Mareo, náuseas, vómito, cinetosis (mareo por movimiento)'),
('Bismuto subsalicílico', 'Protector gástrico usado en molestias digestivas leves.', 'Indigestión, náuseas, diarrea leve, malestar estomacal'),
('Dextrometorfano jarabe', 'Antitusivo de acción central.', 'Tos seca, tos irritativa, tos nocturna'),
('Ambroxol jarabe', 'Mucolítico que facilita la expulsión de flema.', 'Tos con flema, congestión bronquial, secreciones respiratorias'),
('Pseudoefedrina 60mg', 'Descongestionante nasal de acción sistémica.', 'Congestión nasal, resfriado común, sinusitis'),
('Vitamina C 500mg', 'Suplemento vitamínico antioxidante.', 'Fortalecimiento del sistema inmune, resfriados, cansancio, defensas bajas'),
('Complejo B', 'Suplemento con vitaminas del grupo B.', 'Fatiga, cansancio, neuritis, debilidad, estrés'),
('Melatonina 3mg', 'Suplemento regulador del ciclo del sueño.', 'Insomnio, dificultad para conciliar el sueño, jet lag');
