import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../css/AboutUs.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faHeart ,faQuoteLeft, faQuoteRight, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { ImArrowLeft2 } from "react-icons/im";

const AboutUs = () => {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isTypingDone, setIsTypingDone] = useState(false);
  const words = ['Creating memories.', 'Visual storytelling.', 'Dedicated artisans.'];
  const logo =  '/assets/ak_logo2.png';

  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-out',
      once: true
    });

    const timer = setInterval(() => {
      setCharIndex((prevCharIndex) => prevCharIndex + 1);
      if (charIndex === words[index].length) {
        setCharIndex(0);
        setIndex((prevIndex) => (prevIndex + 1) % words.length);
      }
      if (index === words.length - 1 && charIndex === words[index].length - 1) {
        setIsTypingDone(true);
        clearInterval(timer);
      }
    }, 150); 

    return () => clearInterval(timer);
  }, [charIndex, index, words]);

  return (
    <>
    {/* Back Button Section */}
    <div className='back-btn'>
        <Link to='/'>
          <ImArrowLeft2 />
        </Link>
    </div>
    <div className="container my-2">
    <h2 className="font-weight-bold abtHead">Contact</h2>
      <div className="row align-items-center">
        <div className="col-md-6 order-md-2 my-3 image-container" data-aos="fade-left">
          <img src={logo} alt="About Us" className="logoImg img-fluid rounded small-img" />
        </div>
        <div className="col-md-6 order-md-1" data-aos="fade-right">
          <div className="typical-text mb-4">
          {!isTypingDone ? (
              <p className="typewriter-text">{words[index].substring(0, charIndex)}</p>
            ) : (
              words.map((word) => <p className="typewriter2-text"><FontAwesomeIcon icon={faQuoteLeft}/> {word}  <FontAwesomeIcon icon={faQuoteRight}/></p>)
            )}
          </div>
          <p data-aos="fade-up abtPara">
            Welcome to <strong style={{ fontSize: '1.1rem', color : '#850F8D' }}>AK Digitals</strong>, where we bring your moments to life through our lens. Our studio is dedicated to capturing the essence of every event, whether it's a wedding, corporate event, or personal photoshoot.
          </p>
          <p data-aos="fade-up abtPara">
            At <strong style={{ fontSize: '1.1rem', color : '#850F8D' }}>AK Digitals</strong>, we believe photography is an art. We blend technical skill with creative vision, using state-of-the-art equipment to ensure perfection in every shot.
          </p>
          <p data-aos="fade-up abtPara">
            We pride ourselves on offering a personalized experience, understanding each client's unique needs, and delivering images that exceed expectations. Let us capture your special moments and create timeless memories.
          </p>
          <p data-aos="fade-up abtPara" style={{ fontSize: '1.2rem' }}>
            <strong style={{ fontSize: '1.4rem', color : '#850F8D' }}>Connect</strong> with us on social media:
          </p>

          {/* social media icons */}
          <div className="social-icons" data-aos="fade-up">
            <a href="mailto:ak97.digital@gmail.com" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faEnvelope} size="2x" />
            </a>
            <a href="https://wa.me/+918277494355" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faWhatsapp} size="2x" />
            </a>
            <a href="https://www.instagram.com/abhi.devadi?igsh=MW1pdGcxcjhpZzRiNA==" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faInstagram} size="2x" />
            </a>
            <a href="tel:8277494355">
              <FontAwesomeIcon icon={faPhone} style={{ fontSize: '1.7rem', marginTop:'2px'}} />
            </a>
            {/* <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faFacebook} size="2x" />
            </a>
            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faTwitter} size="2x" />
            </a> */}
          </div>
        </div>
      </div>

      <footer className="footer mt-5">
        <p className="text-center" style={{ fontSize: '1.2rem' }}>
          Made with <FontAwesomeIcon icon={faHeart} style={{ color: 'black' }} /> by MONK VARIABLES
        </p>
        <p className="text-center">
            <a href="mailto:monkvariables09@gmail.com" target="_blank" rel="noopener noreferrer" 
              style={{ textDecoration: 'none', color: 'inherit' }}>
              monkvariables09@gmail.com
            </a>
        </p>
      </footer>
    </div>
    </>
  );
};

export default AboutUs;