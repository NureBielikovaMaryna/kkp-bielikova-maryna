import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ДОДАЛИ ЦЕ
import api from '../../services/api';

function CompaniesList() {
  // Тут ми будемо зберігати компанії, які прийдуть з бекенду
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // useEffect спрацьовує один раз при завантаженні сторінки
  useEffect(() => {
    // Робимо запит до нашого PublicController
    api.get('/Public/companies')
      .then(response => {
        setCompanies(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Помилка при завантаженні компаній:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <h2>Завантаження даних...</h2>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Оберіть компанію-перевізника</h1>
      
      {companies.length === 0 ? (
        <p>Наразі немає зареєстрованих компаній.</p>
      ) : (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {companies.map(company => (
            <div key={company.id} style={{
              border: '1px solid #ccc',
              padding: '20px',
              borderRadius: '8px',
              width: '300px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
              <h2>{company.name}</h2>
              <p>{company.description}</p>
              <button 
              onClick={() => navigate(`/schedule/${company.id}`)}
              style={{
                padding: '10px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>
                Подивитися розклад
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompaniesList;