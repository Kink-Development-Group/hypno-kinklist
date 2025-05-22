import React from 'react';
import { KinklistProvider, useKinklist } from './context/KinklistContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Legend from './components/Legend';
import Export from './components/Export';
import InputList from './components/InputList';
import EditOverlay from './components/EditOverlay';
import InputOverlay from './components/InputOverlay';
import ThemeToggle from './components/ThemeToggle';
import './styles/main.scss';

// Default kinks text
const defaultKinksText = `#Basics
(General)
* I enjoy working with cisgender people
* I enjoy working with trans people
* I enjoy working with non-binary people
* I enjoy working with males
* I enjoy working with females
* Gender doesn't matter to me
* I drop very easily
* I move or twitch a lot while under
* I come out of trance easily
* I am disoriented after coming back
* I need a very safe environment
* I experience amnesia after coming back
* I am a very suggestible person

#Safety and consent
(General)
* Trust
* Unknown play partner
* A lot of safety talk / triggers
* Long pretalk
* Very clear contract about what's going to happen
* Less rapport/empathy
* Post talk/Aftercare
* Dropping without warning
* People watching the trance
* Triggers used without warning
* Triggers used in public
* Knowing what will happen before Trance
* Making wishes beforehand
* Clear consent before going under
* Being shown off while hypnotized
* Not deleting Triggers after a Session
* Being told to come back up if necessary

#Types Of Hypnosis
(General)
* Erotic hypnosis
* Recreational hypnosis
* Therapeutic hypnosis
* Stage hypnosis
* BDSM components
* D/S-Hypno stuff
* Text hypnosis
* Audio hypnosis
* Video hypnosis
* In person hypnosis
* Multiple hypnotists at once
* Multiple subjects at once
* Covert hypnosis

#Preferences
(General)
* Watching others go under
* Watching others hypnotize someone
* Resistance
* Brattiness
* Long trance sessions
* Drooling
* Eye rolls
* Being submissive
* Receiving Dominance
* Talking while under
* Being surprised
* Hypnotist doing whatever they want

#Stimuli
(General)
* Auditory stimuli
* Kinesthetic stimuli
* Visual stimuli
* Binaurals
* Snapping fingers
* Spirals
* Pendulums
* Shiny items
* Crystals
* Flashing light
* Pocket watch
* Metronome
* Hand movements/signs

#Inductions
(General)
* With slow speaking
* With faster speech
* With soothing voices
* Confusion
* Overload
* Relaxation
* Progressive muscle relaxation
* Conversational
* Mirroring
* Visual Things
* Auditory Things
* Fractionation
* Recall of last trance
* Countdown
* Focusing on something
* Eye fixation
* Instant inductions

#Emotion Play
(I enjoy feeling or making someone feel…)
* Beautiful and sensuous
* Emotionless and empty
* Empowered and focused
* Energized
* Helpless
* Naughty
* Captive
* Objectified
* Impersonal
* Detached
* Aroused
* Pleasure
* Exploring fantasies
* Safe and protected
* Vulnerable
* Fear
* Degraded
* Humiliated

#Coming Out Of Trance
(General)
* Slow counts back up
* Wake up trigger
* Only counting to three or five
* Just being told to come back or wake up

#Suggestions 1
(General)
* Post hypnotic suggestions
* Catalepsy
* Immobilization
* Levitation
* Freeze / ‘Stop’ Triggers
* Blank and empty
* Amnesia
* Mantras
* Behavior modification
* Personality play
* Positive Hallucination
* Negative Hallucination
* Mind melting
* Brainwashing
* Mind controlling
* Transformation
* Pet play
* Complete control
* Big and little play
* Surrendering
* Submission
* Drugging
* Being playful
* Being naughty
* Captivity / helplessness
* Power play
* Passiveness
* Orgasm trigger
* Seduction
* Touch-free pleasure
* Touch-free orgasm

#Suggestions 2
(General)
* Feminization
* Masculinization
* Furry
* Dollification
* Robotization
* Memory play
* Objectification
* Bimbofication
* IQ Play
* Rape play
* BDSM
* DS-Play
* Consensual non consent
* Sissy training
* Diapering
* Blackmail
* Watersports
* Obedience
* Pain triggers
* Tease and release
* Tease and denial
* Edging
* Covert D / S
* Resistance Play
* Indirect sexual description
* Direct sexual description
* Being guided
* Getting attention
* Being ordered to undress
* Being ordered to masturbate
* Being forced to do something`;

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <KinklistProvider initialKinksText={defaultKinksText}>
        <AppContent />
      </KinklistProvider>
    </ThemeProvider>
  );
};

// Separate component to use context
const AppContent: React.FC = () => {
  const { setIsEditOverlayOpen, setIsInputOverlayOpen } = useKinklist();
  const { theme, toggleTheme } = useTheme();

  const handleEditClick = () => {
    setIsEditOverlayOpen(true);
  };

  const handleStartClick = () => {
    setIsInputOverlayOpen(true);
  };
  return (
    <div className="container">
      <div className="header-controls">
        <button type='button' title='edit' id="Edit" onClick={handleEditClick} aria-label="Bearbeiten"></button>
        <h1>Hypno Kink List</h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />      </div>
      
      <Legend />
      
      <div className="action-buttons-container">
        <div className="export-container">
          <Export />
        </div>
        
        <button 
          type='button' 
          title='start' 
          id="StartBtn" 
          onClick={handleStartClick}
          aria-label="Starten"
          className="start-button"
        >
          <span className="button-label">Starten</span>
        </button>
      </div>
      
      <div className="grid-container">
        <div className="grid-row">
          <div className="grid-col-12">
            <InputList />
          </div>
        </div>
      </div>
        <EditOverlay />
      <InputOverlay />
    </div>
  );
};

export default App;
