import React from "react";
import { KinklistProvider, useKinklist } from "./context/KinklistContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Legend from "./components/Legend";
import Export from "./components/Export";
import InputList from "./components/InputList";
import EditOverlay from "./components/EditOverlay";
import InputOverlay from "./components/InputOverlay";
import CommentOverlay from "./components/CommentOverlay";
import ThemeToggle from "./components/ThemeToggle";
import "./styles/main.scss";

// Default kinks text with comprehensive English descriptions for all kinks
const defaultKinksText = `#Basics
(General)
* I enjoy working with cisgender people
? I feel comfortable and positive about engaging in hypnosis with cisgender individuals.
* I enjoy working with trans people
? I am open to and enjoy hypnotic experiences with transgender people, respecting their identities.
* I enjoy working with non-binary people
? I value and welcome non-binary participants in hypnosis, appreciating gender diversity.
* I enjoy working with males
? I am interested in hypnotic play with men, regardless of other factors.
* I enjoy working with females
? I am interested in hypnotic play with women, regardless of other factors.
* Gender doesn't matter to me
? The gender of my hypnosis partner is not important to me; I focus on the experience itself.
* I drop very easily
? I enter trance states quickly and with little resistance, often after minimal induction.
* I move or twitch a lot while under
? My body may move, twitch, or react physically while I am in trance.
* I come out of trance easily
? I can return to full awareness from trance quickly, often without much prompting.
* I am disoriented after coming back
? After trance, I may feel confused, foggy, or need time to reorient myself.
* I need a very safe environment
? I require a secure, supportive, and non-threatening setting to feel comfortable in hypnosis.
* I experience amnesia after coming back
? I sometimes forget what happened during trance, either intentionally or unintentionally.
* I am a very suggestible person
? I respond strongly to hypnotic suggestions and can be deeply influenced in trance.

#Safety and consent
(General)
* Trust
? Trust is the foundation of any hypnotic interaction; I need to feel safe with my partner.
* Unknown play partner
? I may feel uneasy or require extra caution when engaging with someone I don't know well.
* A lot of safety talk / triggers
? I prefer thorough discussions about boundaries, triggers, and safety before starting.
* Long pretalk
? I appreciate detailed conversations before trance to set expectations and ensure comfort.
* Very clear contract about what's going to happen
? I want explicit agreements about what will and won't happen during the session.
* Less rapport/empathy
? I am comfortable with a more clinical or detached approach, with less emotional connection.
* Post talk/Aftercare
? I value time after trance to discuss the experience, decompress, and ensure well-being.
* Dropping without warning
? I am okay with or enjoy being put into trance unexpectedly, without prior notice.
* People watching the trance
? I am comfortable with others observing my trance state, either in person or virtually.
* Triggers used without warning
? I am okay with hypnotic triggers being used spontaneously, without advance notice.
* Triggers used in public
? I am open to having triggers activated in public settings, with appropriate discretion.
* Knowing what will happen before Trance
? I prefer to be fully informed about all planned activities before entering trance.
* Making wishes beforehand
? I like to express my desires or intentions for the session before starting.
* Clear consent before going under
? I require explicit, enthusiastic consent before any hypnotic activity begins.
* Being shown off while hypnotized
? I enjoy being displayed or demonstrated while in trance, for others to see.
* Not deleting Triggers after a Session
? I am comfortable with triggers remaining active after the session ends.
* Being told to come back up if necessary
? I want to be able to return to full awareness immediately if needed, for safety.

#Types Of Hypnosis
(General)
* Erotic hypnosis
? Hypnosis with a focus on sexual arousal, pleasure, or erotic scenarios.
* Recreational hypnosis
? Hypnosis for fun, relaxation, or entertainment, without therapeutic or sexual intent.
* Therapeutic hypnosis
? Hypnosis used for healing, self-improvement, or addressing psychological issues.
* Stage hypnosis
? Hypnosis performed as entertainment, often in front of an audience, with volunteers.
* BDSM components
? Incorporating elements of dominance, submission, or power exchange into hypnosis.
* D/S-Hypno stuff
? Hypnosis that explicitly explores Dominance/submission dynamics and roles.
* Text hypnosis
? Hypnotic inductions or suggestions delivered through written words or scripts.
* Audio hypnosis
? Hypnosis delivered via audio recordings, voice messages, or live voice.
* Video hypnosis
? Hypnosis experienced through video, combining visual and auditory cues.
* In person hypnosis
? Hypnosis conducted face-to-face, allowing for direct interaction and feedback.
* Multiple hypnotists at once
? Being hypnotized by more than one hypnotist simultaneously, often for complex scenes.
* Multiple subjects at once
? Participating in hypnosis with other subjects, either as a group or in parallel.
* Covert hypnosis
? Hypnosis performed subtly or without the subject's full awareness, often for roleplay.

#Preferences
(General)
* Watching others go under
? I enjoy observing others as they enter trance, finding it fascinating or arousing.
* Watching others hypnotize someone
? I like to see hypnotists at work, learning from their techniques or enjoying the dynamic.
* Resistance
? I enjoy resisting hypnotic suggestions, either playfully or as part of a power dynamic.
* Brattiness
? I like to be cheeky, playful, or defiant during hypnosis, challenging the hypnotist.
* Long trance sessions
? I prefer extended periods in trance, allowing for deeper experiences and exploration.
* Drooling
? I find it enjoyable or arousing to drool or lose control of saliva while in trance.
* Eye rolls
? I like the sensation or appearance of my eyes rolling back during hypnosis.
* Being submissive
? I enjoy taking a submissive role, following instructions and surrendering control.
* Subject Dominance
? I like when the hypnotist takes charge, asserting authority and guiding the session.
* Talking while under
? I am comfortable or enjoy speaking, answering questions, or roleplaying while in trance.
* Being surprised
? I enjoy unexpected suggestions, surprises, or twists during hypnosis.
* Hypnotist doing whatever they want
? I am open to the hypnotist improvising or taking full creative control, within agreed limits.

#Stimuli
(General)
* Auditory stimuli
? Sounds, music, or spoken words used to deepen trance or enhance the experience.
* Kinesthetic stimuli
? Physical sensations, such as touch or movement, used as hypnotic cues.
* Visual stimuli
? Lights, patterns, or visual objects that help induce or deepen trance.
* Binaurals
? Binaural beats or tones used to alter brainwaves and facilitate trance.
* Snapping fingers
? The sound or gesture of finger snapping as a hypnotic trigger or cue.
* Spirals
? Spinning or swirling patterns used to focus attention and induce trance.
* Pendulums
? Swinging objects, like a pocket watch, used for visual fixation and induction.
* Shiny items
? Reflective or glittering objects that attract attention and aid in trance.
* Crystals
? Crystals or gemstones used as focal points for relaxation or induction.
* Flashing light
? Pulsing or flashing lights used to create hypnotic effects or deepen trance.
* Pocket watch
? The classic hypnotist's tool, swung to focus attention and induce trance.
* Metronome
? A device that produces regular, rhythmic sounds to help pace inductions.
* Hand movements/signs
? Gestures or hand signals used to direct attention or signal suggestions.

#Inductions
(Hypnotist, Subject)
* With slow speaking
? Inductions delivered in a slow, calming voice to promote relaxation.
* With faster speech
? Rapid or energetic speech used to overwhelm and induce trance quickly.
* With soothing voices
? Gentle, comforting tones that help the subject relax and let go.
* Confusion
? Techniques that create mental confusion, making the mind more open to suggestion.
* Overload
? Overwhelming the senses or mind to bypass resistance and induce trance.
* Relaxation
? Focusing on relaxing the body and mind as the primary induction method.
* Progressive muscle relaxation
? Gradually relaxing each muscle group to deepen trance and comfort.
* Conversational
? Using natural conversation to subtly guide the subject into trance.
* Mirroring
? Reflecting the subject's words or actions to build rapport and facilitate trance.
* Visual Things
? Using visual cues, such as objects or imagery, to help induce trance.
* Auditory Things
? Employing sounds, music, or voice to guide the subject into trance.
* Fractionation
? Bringing the subject in and out of trance repeatedly to deepen the experience.
* Recall of last trance
? Using memories of previous trance states to quickly re-induce hypnosis.
* Countdown
? Counting down numbers to signal deepening relaxation and approach to trance.
* Focusing on something
? Directing attention to a single point or idea to facilitate induction.
* Eye fixation
? Having the subject stare at an object or spot to induce trance.
* Instant inductions
? Rapid techniques that trigger trance almost immediately, often with a single cue.

#Emotion Play
(Hypnotist, Subject)
* Beautiful and sensuous
? Feeling attractive, desired, and deeply in touch with sensuality during trance.
* Emotionless and empty
? Experiencing a blank, numb, or detached state, free from emotion.
* Empowered and focused
? Gaining confidence, clarity, and a sense of purpose through hypnosis.
* Energized
? Feeling invigorated, lively, and full of energy after trance.
* Helpless
? Enjoying the sensation of being unable to resist or act, fully under control.
* Naughty
? Feeling mischievous, playful, or inclined to break rules while hypnotized.
* Captive
? Experiencing the thrill of being captured, restrained, or held against one's will (consensually).
* Objectified
? Being treated as an object, toy, or thing, rather than a person, for the duration of trance.
* Impersonal
? Feeling like an anonymous or generic entity, with personal identity minimized.
* Detached
? Experiencing a sense of separation from thoughts, feelings, or surroundings.
* Aroused
? Feeling sexual excitement or desire as a result of hypnotic suggestions.
* Pleasure
? Experiencing intense or prolonged pleasure, either physical or emotional, in trance.
* Exploring fantasies
? Safely exploring desires, scenarios, or fantasies that may not be possible in real life.
* Safe and protected
? Feeling completely secure, cared for, and shielded from harm during hypnosis.
* Vulnerable
? Enjoying the sensation of being open, exposed, or emotionally raw in trance.
* Fear
? Experiencing controlled, consensual fear or suspense for excitement or catharsis.
* Degraded
? Feeling humiliated, embarrassed, or lowered in status as part of a consensual scene.
* Humiliated
? Enjoying embarrassment, shame, or being made fun of in a safe, controlled way.

#Coming Out Of Trance
(General)
* Slow counts back up
? Returning to awareness through a gradual, gentle counting process.
* Wake up trigger
? Using a specific word or phrase to instantly bring the subject out of trance.
* Only counting to three or five
? Short, simple counts to signal the end of trance and return to normal awareness.
* Just being told to come back or wake up
? Responding to direct verbal instructions to return to full consciousness.

#Suggestions 1
(Hypnotist, Subject)
* Post hypnotic suggestions
? Instructions given during trance that take effect after the session ends.
* Catalepsy
? Inducing rigidity or immobility in a limb or the whole body, often as a demonstration.
* Immobilization
? Preventing movement, making the subject feel stuck or frozen in place.
* Levitation
? Creating the sensation of a limb or the body rising or floating involuntarily.
* Freeze / ‘Stop’ Triggers
? Instantly stopping all movement or thought in response to a specific cue.
* Blank and empty
? Inducing a state of mental emptiness, free from thoughts or distractions.
* Amnesia
? Causing the subject to forget certain events, words, or experiences from trance.
* Mantras
? Repeating words or phrases to reinforce suggestions or deepen trance.
* Behavior modification
? Using hypnosis to change habits, reactions, or behaviors, either temporarily or long-term.
* Personality play
? Adopting new personalities, roles, or identities during trance for fun or exploration.
* Positive Hallucination
? Experiencing things that aren't really there, such as imagined sights or sounds.
* Negative Hallucination
? Failing to perceive something that is actually present, as suggested by the hypnotist.
* Mind melting
? Feeling as if thoughts are dissolving, blending, or becoming incoherent.
* Brainwashing
? Intense, repeated suggestions to reshape beliefs or attitudes, often for roleplay.
* Mind controlling
? Experiencing the sensation of having one's thoughts or actions directed by another.
* Transformation
? Changing into another person, creature, or object, either physically or mentally, in trance.
* Pet play
? Taking on the role or mindset of an animal, such as a puppy or kitten, during hypnosis.
* Complete control
? Surrendering all decision-making and autonomy to the hypnotist.
* Big and little play
? Exploring age regression or progression, acting as a child or adult in trance.
* Surrendering
? Letting go of resistance and fully yielding to the hypnotist's guidance.
* Submission
? Embracing a submissive mindset, eager to obey and please the hypnotist.
* Drugging
? Experiencing the sensation of being drugged or intoxicated, as suggested in trance.
* Being playful
? Enjoying lighthearted, fun, or silly suggestions and scenarios.
* Being naughty
? Acting mischievously or breaking rules in a safe, controlled way.
* Captivity / helplessness
? Feeling trapped, restrained, or unable to escape, for excitement or arousal.
* Power play
? Exploring dynamics of dominance, control, and authority in hypnosis.
* Passiveness
? Adopting a passive, receptive role, allowing things to happen without resistance.
* Orgasm trigger
? Experiencing orgasm in response to a specific hypnotic cue or suggestion.
* Seduction
? Feeling irresistibly attracted or compelled, either as hypnotist or subject.
* Touch-free pleasure
? Experiencing pleasure or orgasm without any physical touch, purely through suggestion.
* Touch-free orgasm
? Achieving orgasm solely through hypnotic suggestion, without physical stimulation.

#Suggestions 2
(Hypnotist, Subject)
* Feminization
? Experiencing or adopting feminine traits, behaviors, or identity in trance.
* Masculinization
? Experiencing or adopting masculine traits, behaviors, or identity in trance.
* Furry
? Taking on animal characteristics, such as fur, tail, or mindset, during hypnosis.
* Dollification
? Becoming like a doll, mannequin, or puppet, often with restricted movement or will.
* Robotization
? Feeling or acting like a robot, with mechanical movements or programmed responses.
* Memory play
? Manipulating, erasing, or implanting memories as part of the hypnotic experience.
* Objectification
? Being treated as an object or thing, losing personal agency or identity.
* Bimbofication
? Adopting exaggeratedly feminine, ditzy, or sexualized traits in trance.
* IQ Play
? Experiencing changes in intelligence, such as feeling smarter or dumber, as suggested.
* Rape play
? Consensually exploring non-consent scenarios in a safe, negotiated context.
* BDSM
? Incorporating bondage, discipline, dominance, submission, sadism, or masochism into hypnosis.
* DS-Play
? Exploring Dominance/submission roles and dynamics through hypnotic suggestions.
* Consensual non consent
? Agreeing in advance to scenarios where consent is suspended or simulated as absent.
* Sissy training
? Adopting feminized, submissive, or sissy roles and behaviors in trance.
* Diapering
? Experiencing wearing or using diapers, often as part of age play or regression.
* Blackmail
? Roleplaying scenarios involving coercion, secrets, or threats, always consensually.
* Watersports
? Involving urination or related activities as part of the hypnotic experience.
* Obedience
? Feeling compelled to obey commands or suggestions without question.
* Pain triggers
? Experiencing pain or discomfort in response to specific cues, within safe limits.
* Tease and release
? Building up arousal or anticipation, then allowing release at the hypnotist's discretion.
* Tease and denial
? Building up arousal but preventing release, as a form of control or play.
* Edging
? Repeatedly bringing to the brink of orgasm, then backing off, as suggested in trance.
* Covert D / S
? Subtle or hidden dominance/submission dynamics, not obvious to outsiders.
* Resistance Play
? Playfully or seriously resisting suggestions, as part of the hypnotic dynamic.
* Indirect sexual description
? Using suggestive, indirect language to evoke sexual ideas or feelings.
* Direct sexual description
? Using explicit, direct language to describe sexual acts or sensations.
* Being guided
? Enjoying being led step-by-step through actions, thoughts, or fantasies.
* Getting attention
? Craving or enjoying focused attention from the hypnotist or others during trance.
* Being ordered to undress
? Responding to commands to remove clothing, as part of a consensual scene.
* Being ordered to masturbate
? Following hypnotic suggestions to touch oneself, within agreed boundaries.
* Being forced to do something
? Experiencing the sensation of being compelled to act, even against one's will, in a safe, consensual context.`;

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
        <button
          type="button"
          title="edit"
          id="Edit"
          onClick={handleEditClick}
          aria-label="Bearbeiten"
        ></button>
        <h1>Hypno Kink List - BETA</h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />{" "}
      </div>

      <Legend />

      <div className="action-buttons-container">
        <div className="export-container">
          <Export />
        </div>

        <button
          type="button"
          title="start"
          id="StartBtn"
          onClick={handleStartClick}
          aria-label="Start"
          className="start-button"
        >
          <span className="button-label">Start</span>
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
      <CommentOverlay />
    </div>
  );
};

export default App;
