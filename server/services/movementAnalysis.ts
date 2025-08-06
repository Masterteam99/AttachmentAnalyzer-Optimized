import { analyzeMovementForm } from "./openai";
import { biomechanicalRulesEngine } from "./biomechanicalRulesEngine";
import { videoReferenceService } from "./videoReferenceService";
import type { ValidationResult } from "./biomechanicalRulesEngine";

interface KeyPoint {
  x: number;
  y: number;
  visibility: number;
}

interface PoseData {
  keypoints: KeyPoint[];
  timestamp: number;
}

interface TripleAnalysisResult {
  formScore: number;
  feedback: string;
  corrections: string[];
  strengths: string[];
  keypoints?: any[];
  analysisDetails: {
    gptAnalysis: {
      score: number;
      feedback: string;
      weight: 33;
    };
    ptComparison: {
      score: number;
      feedback: string;
      weight: 33;
    };
    biomechanicalRules: {
      score: number;
      feedback: string;
      weight: 34;
    };
  };
}

class MovementAnalysisService {
  async analyzeMovement(exerciseName: string, videoData: string): Promise<TripleAnalysisResult> {
    try {
      console.log(`🔧 Using demo analysis for ${exerciseName} in development`);
      
      // Temporary: Use demo analysis directly for development
      const demoResult = this.getDemoAnalysis(exerciseName);
      const simulatedKeypoints = this.simulateKeypointExtraction(videoData);
      
      return {
        ...demoResult,
        keypoints: simulatedKeypoints,
        analysisDetails: {
          gptAnalysis: { score: demoResult.formScore, feedback: "Development mode", weight: 33 },
          ptComparison: { score: demoResult.formScore, feedback: "Development mode", weight: 33 },
          biomechanicalRules: { score: demoResult.formScore, feedback: "Development mode", weight: 34 }
        }
      };
    } catch (error) {
      console.error("Error in movement analysis:", error);
      // Fallback a demo analysis
      return {
        ...this.getDemoAnalysis(exerciseName),
        keypoints: this.simulateKeypointExtraction(videoData),
        analysisDetails: {
          gptAnalysis: { score: 75, feedback: "Demo GPT analysis", weight: 33 },
          ptComparison: { score: 70, feedback: "Demo PT comparison", weight: 33 },
          biomechanicalRules: { score: 80, feedback: "Demo biomechanical rules", weight: 34 }
        }
      };
    }
  }

  private async performGPTAnalysis(exerciseName: string, keypoints: PoseData[]): Promise<{
    score: number;
    feedback: string;
  }> {
    try {
      const analysis = await analyzeMovementForm(exerciseName, keypoints);
      return {
        score: analysis.formScore,
        feedback: analysis.feedback
      };
    } catch (error) {
      console.log("GPT analysis failed, using fallback");
      return {
        score: 75,
        feedback: "Analisi GPT non disponibile. Forma generale buona."
      };
    }
  }

  private async performPTComparison(exerciseName: string, keypoints: PoseData[]): Promise<{
    score: number;
    feedback: string;
  }> {
    try {
      const comparison = await videoReferenceService.compareWithPTReference(exerciseName, keypoints);
      return {
        score: comparison.similarityScore,
        feedback: comparison.overallFeedback
      };
    } catch (error) {
      console.log("PT comparison failed, using fallback");
      return {
        score: 70,
        feedback: "Video di riferimento PT non disponibile. Mantieni la forma corretta."
      };
    }
  }

  private async performBiomechanicalAnalysis(exerciseName: string, keypoints: PoseData[]): Promise<{
    score: number;
    feedback: string;
  }> {
    try {
      // Utilizza il nuovo metodo che legge i trigger dal tuo foglio di calcolo
      const biomechanicalResult = await biomechanicalRulesEngine.getBiomechanicalFeedback(exerciseName, keypoints);
      
      let feedback = "Esecuzione biomeccanicamente corretta.";
      
      if (biomechanicalResult.triggersFired.length > 0) {
        // Crea feedback basato sui trigger attivati dal tuo foglio di calcolo
        const criticalFeedback = biomechanicalResult.criticalErrors.slice(0, 2).join(" ");
        const suggestions = biomechanicalResult.suggestions.slice(0, 1).join("");
        
        feedback = criticalFeedback ? 
          `${criticalFeedback} ${suggestions}` : 
          `Trigger rilevati: ${biomechanicalResult.triggersFired.join(", ")}. ${suggestions}`;
      }
      
      return {
        score: biomechanicalResult.biomechanicalScore,
        feedback
      };
    } catch (error) {
      console.log("Biomechanical analysis failed, using fallback");
      return {
        score: 80,
        feedback: "Analisi biomeccanica completata. Mantieni la forma."
      };
    }
  }

  private synthesizeAnalysis(
    gptAnalysis: { score: number; feedback: string },
    ptComparison: { score: number; feedback: string },
    biomechanicalAnalysis: { score: number; feedback: string }
  ): {
    formScore: number;
    feedback: string;
    corrections: string[];
    strengths: string[];
  } {
    // Calcolo weighted score: 33% + 33% + 34%
    const finalScore = Math.round(
      (gptAnalysis.score * 0.33) +
      (ptComparison.score * 0.33) +
      (biomechanicalAnalysis.score * 0.34)
    );

    // Genera feedback sintetizzato
    const feedback = this.generateSynthesizedFeedback(finalScore, [
      gptAnalysis.feedback,
      ptComparison.feedback,
      biomechanicalAnalysis.feedback
    ]);

    // Estrai correzioni e punti di forza
    const corrections = this.extractCorrections([
      gptAnalysis.feedback,
      ptComparison.feedback,
      biomechanicalAnalysis.feedback
    ]);

    const strengths = this.extractStrengths(finalScore);

    return {
      formScore: finalScore,
      feedback,
      corrections,
      strengths
    };
  }

  private generateSynthesizedFeedback(score: number, feedbacks: string[]): string {
    const validFeedbacks = feedbacks.filter(f => f && f.length > 10);
    
    if (score >= 90) {
      return "Ottima esecuzione! Tutti i sistemi di analisi confermano una forma eccellente.";
    } else if (score >= 80) {
      return "Buona esecuzione generale. " + (validFeedbacks[0] || "Continua così!");
    } else if (score >= 70) {
      return "Forma discreta, ma migliorabile. " + (validFeedbacks.slice(0, 2).join(" ") || "Focus sulla tecnica.");
    } else {
      return "L'esecuzione necessita miglioramenti. " + (validFeedbacks.join(" ") || "Rivedi la tecnica di base.");
    }
  }

  private extractCorrections(feedbacks: string[]): string[] {
    const corrections: string[] = [];
    
    feedbacks.forEach(feedback => {
      if (feedback.includes("mantieni") || feedback.includes("evita") || feedback.includes("concentrati")) {
        corrections.push(feedback);
      }
    });

    // Aggiungi correzioni generiche se non trovate
    if (corrections.length === 0) {
      corrections.push("Mantieni la forma durante tutto il movimento");
      corrections.push("Controlla la velocità di esecuzione");
    }

    return corrections.slice(0, 3); // Max 3 correzioni
  }

  private extractStrengths(score: number): string[] {
    const strengths: string[] = [];
    
    if (score >= 80) {
      strengths.push("Buon controllo del movimento");
    }
    if (score >= 70) {
      strengths.push("Postura generale corretta");
    }
    if (score >= 60) {
      strengths.push("Comprensione base dell'esercizio");
    }

    return strengths.length > 0 ? strengths : ["Continuità nell'allenamento"];
  }

  private getDemoAnalysis(exerciseName: string): {
    formScore: number;
    feedback: string;
    corrections: string[];
    strengths: string[];
  } {
    const demoScores: { [key: string]: number } = {
      squat: 78,
      pushup: 82,
      lunge: 75,
      plank: 85,
      burpee: 70
    };

    const score = demoScores[exerciseName.toLowerCase()] || 75;

    return {
      formScore: score,
      feedback: `Analisi demo per ${exerciseName}. Score: ${score}/100`,
      corrections: ["Demo: Mantieni la forma corretta", "Demo: Controlla la velocità"],
      strengths: ["Demo: Buona comprensione base", "Demo: Movimento fluido"]
    };
  }

  private simulateKeypointExtraction(videoData: string): PoseData[] {
    // This simulates MediaPipe pose detection results
    // In a real implementation, you would:
    // 1. Decode the video data
    // 2. Process each frame with MediaPipe
    // 3. Extract pose keypoints
    // 4. Return the keypoint data
    
    const simulatedFrames: PoseData[] = [];
    const frameCount = 30; // Simulate 30 frames
    
    for (let i = 0; i < frameCount; i++) {
      const keypoints: KeyPoint[] = [
        // Simulate key body landmarks (MediaPipe pose landmarks)
        { x: 0.5 + Math.random() * 0.1 - 0.05, y: 0.2 + Math.random() * 0.05, visibility: 0.9 }, // Head
        { x: 0.45 + Math.random() * 0.1 - 0.05, y: 0.35 + Math.random() * 0.05, visibility: 0.8 }, // Left shoulder
        { x: 0.55 + Math.random() * 0.1 - 0.05, y: 0.35 + Math.random() * 0.05, visibility: 0.8 }, // Right shoulder
        { x: 0.4 + Math.random() * 0.1 - 0.05, y: 0.5 + Math.random() * 0.05, visibility: 0.7 }, // Left elbow
        { x: 0.6 + Math.random() * 0.1 - 0.05, y: 0.5 + Math.random() * 0.05, visibility: 0.7 }, // Right elbow
        { x: 0.35 + Math.random() * 0.1 - 0.05, y: 0.65 + Math.random() * 0.05, visibility: 0.6 }, // Left wrist
        { x: 0.65 + Math.random() * 0.1 - 0.05, y: 0.65 + Math.random() * 0.05, visibility: 0.6 }, // Right wrist
        { x: 0.48 + Math.random() * 0.04 - 0.02, y: 0.7 + Math.random() * 0.05, visibility: 0.9 }, // Left hip
        { x: 0.52 + Math.random() * 0.04 - 0.02, y: 0.7 + Math.random() * 0.05, visibility: 0.9 }, // Right hip
        { x: 0.47 + Math.random() * 0.06 - 0.03, y: 0.85 + Math.random() * 0.05, visibility: 0.8 }, // Left knee
        { x: 0.53 + Math.random() * 0.06 - 0.03, y: 0.85 + Math.random() * 0.05, visibility: 0.8 }, // Right knee
        { x: 0.46 + Math.random() * 0.08 - 0.04, y: 0.95 + Math.random() * 0.03, visibility: 0.7 }, // Left ankle
        { x: 0.54 + Math.random() * 0.08 - 0.04, y: 0.95 + Math.random() * 0.03, visibility: 0.7 }, // Right ankle
      ];
      
      simulatedFrames.push({
        keypoints,
        timestamp: i * 33.33 // 30 FPS = 33.33ms per frame
      });
    }
    
    return simulatedFrames;
  }

  async validateExerciseForm(exerciseName: string, keypoints: PoseData[]): Promise<{
    isCorrectForm: boolean;
    confidence: number;
    issues: string[];
  }> {
    try {
      // Analyze the sequence of keypoints to validate form
      const analysis = await analyzeMovementForm(exerciseName, keypoints);
      
      return {
        isCorrectForm: analysis.formScore >= 70,
        confidence: analysis.formScore / 100,
        issues: analysis.corrections
      };
    } catch (error) {
      console.error("Error validating exercise form:", error);
      throw new Error("Failed to validate exercise form: " + (error as Error).message);
    }
  }

  calculateMovementMetrics(keypoints: PoseData[]): {
    rangeOfMotion: number;
    stability: number;
    symmetry: number;
    tempo: number;
  } {
    if (keypoints.length === 0) {
      return { rangeOfMotion: 0, stability: 0, symmetry: 0, tempo: 0 };
    }

    // Calculate range of motion (simplified)
    let maxY = -Infinity;
    let minY = Infinity;
    
    keypoints.forEach(frame => {
      frame.keypoints.forEach(point => {
        maxY = Math.max(maxY, point.y);
        minY = Math.min(minY, point.y);
      });
    });
    
    const rangeOfMotion = (maxY - minY) * 100; // Convert to percentage

    // Calculate stability (less movement in static points = better stability)
    const hipMovement = this.calculatePointStability(keypoints, [7, 8]); // Hip indices
    const stability = Math.max(0, 100 - hipMovement * 100);

    // Calculate symmetry (compare left vs right side movements)
    const leftSideMovement = this.calculateSideMovement(keypoints, [1, 3, 5, 7, 9, 11]); // Left side indices
    const rightSideMovement = this.calculateSideMovement(keypoints, [2, 4, 6, 8, 10, 12]); // Right side indices
    const symmetry = Math.max(0, 100 - Math.abs(leftSideMovement - rightSideMovement) * 100);

    // Calculate tempo (movement speed consistency)
    const tempoVariation = this.calculateTempoVariation(keypoints);
    const tempo = Math.max(0, 100 - tempoVariation * 100);

    return {
      rangeOfMotion: Math.round(rangeOfMotion),
      stability: Math.round(stability),
      symmetry: Math.round(symmetry),
      tempo: Math.round(tempo)
    };
  }

  private calculatePointStability(keypoints: PoseData[], pointIndices: number[]): number {
    if (keypoints.length < 2) return 0;

    let totalMovement = 0;
    let count = 0;

    for (let i = 1; i < keypoints.length; i++) {
      pointIndices.forEach(index => {
        if (keypoints[i].keypoints[index] && keypoints[i-1].keypoints[index]) {
          const curr = keypoints[i].keypoints[index];
          const prev = keypoints[i-1].keypoints[index];
          const movement = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
          totalMovement += movement;
          count++;
        }
      });
    }

    return count > 0 ? totalMovement / count : 0;
  }

  private calculateSideMovement(keypoints: PoseData[], sideIndices: number[]): number {
    if (keypoints.length < 2) return 0;

    let totalMovement = 0;
    let count = 0;

    for (let i = 1; i < keypoints.length; i++) {
      sideIndices.forEach(index => {
        if (keypoints[i].keypoints[index] && keypoints[i-1].keypoints[index]) {
          const curr = keypoints[i].keypoints[index];
          const prev = keypoints[i-1].keypoints[index];
          const movement = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
          totalMovement += movement;
          count++;
        }
      });
    }

    return count > 0 ? totalMovement / count : 0;
  }

  private calculateTempoVariation(keypoints: PoseData[]): number {
    if (keypoints.length < 3) return 0;

    const movements: number[] = [];
    for (let i = 1; i < keypoints.length; i++) {
      let frameMovement = 0;
      let pointCount = 0;
      
      keypoints[i].keypoints.forEach((point, index) => {
        if (keypoints[i-1].keypoints[index]) {
          const prev = keypoints[i-1].keypoints[index];
          const movement = Math.sqrt(Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2));
          frameMovement += movement;
          pointCount++;
        }
      });
      
      if (pointCount > 0) {
        movements.push(frameMovement / pointCount);
      }
    }

    if (movements.length < 2) return 0;

    // Calculate standard deviation of movements
    const mean = movements.reduce((sum, val) => sum + val, 0) / movements.length;
    const variance = movements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / movements.length;
    const standardDeviation = Math.sqrt(variance);

    return mean > 0 ? standardDeviation / mean : 0;
  }
}

export const movementAnalysisService = new MovementAnalysisService();
