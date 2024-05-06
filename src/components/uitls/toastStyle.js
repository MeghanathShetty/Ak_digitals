import { BsFillCloudSlashFill } from 'react-icons/bs';
import { FcApproval, FcCancel } from "react-icons/fc";
import { GrInstagram } from "react-icons/gr";


export const toastSuccessStyle = () => {
  return {
    position: 'top-center',
    autoClose: 3500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    style: {
      background: '#3E3232',
      color: '#F6F5F2',
      fontWeight: 'bold',
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      margin: '7px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '7px',
      borderRadius: '20px',
      boxShadow: '0px 10px 20px rgba(255, 75, 43, 0.4)'
    },
    icon: <FcApproval style={{ color: '#FCAF45', width: '60px', height: '55px' }} />
  };
};


export const toastErrorStyle = () => {
  return {
    position: 'top-center',
    autoClose: 3500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    style: {
      background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      marging: '7px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '7px',
      borderRadius: '20px',
      boxShadow: '0px 10px 20px rgba(255, 75, 43, 0.4)'
    },
    icon: <FcCancel style={{ color: '#FCAF45', width: '60px', height: '55px' }} />

  };
};
